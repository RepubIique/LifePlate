import type { FastifyInstance } from "fastify";
import type {
  MealConfirmRequest,
  MealConfirmPlannedRequest,
  MealListItem,
  MealListSummary,
  MealPatchResponse,
  MealPlanRequest,
  MealRefineRequest,
  MealReanalyzeRequest,
  MealReorderRequest,
  MealShareExistingRequest,
  MealTextLogRequest,
  MealUpdateRequest,
} from "@lifeplate/shared";
import { dateKeyFromIso, inferMealType, isValidLogDateKeyForUser, isValidPlanDateKey, isMealSource, MAX_MEAL_REANALYZES, mealReanalyzeRemaining, normalizeMealNotes, roundOptionalMealMacro } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";
import { buildCoachingContext, generateCoachNudge } from "../services/coaching.js";
import {
  getDraft,
  deleteDraft,
  updateDraftAnalysis,
  getDraftImage,
  saveDraft,
  draftHasImage,
  updateDraftImage,
  draftBelongsToUser,
} from "../services/drafts.js";
import { validateUploadImage } from "../services/imageValidation.js";
import { MealGuardrailError, assertMealAnalysis } from "../services/mealGuardrails.js";
import { RateLimitError, pruneStaleRateLimitRows, reserveRefineAttempt, reserveUploadAttempt } from "../services/uploadRateLimit.js";
import { analyzeMealImage, analyzeMealText, reanalyzeMealFromFoods, refineMealImage } from "../services/openai.js";
import { assertMealReanalyzeAllowed } from "../services/mealReanalyze.js";
import { onMealDataChanged } from "../services/mealSideEffects.js";
import {
  assertCanLogMeals,
  FreeTierError,
  UserProfileNotReadyError,
} from "../services/freeTier.js";
import {
  reorderMealsForDay,
  ReorderMealsValidationError,
} from "../services/mealReorder.js";
import { extractMealPortionMeta, mergeRawAiPortionMeta } from "../services/mealPortions.js";
import {
  createMealShareRequests,
  MealShareError,
  shareExistingMealWithFriends,
  fetchPendingShareFriendIdsForMeal,
  validateShareFriendIds,
} from "../services/mealShare.js";
import { deleteStoredMealImage, uploadMealImage } from "../services/storage.js";
import { resolveMealImageUrl, mealListImageUrl } from "../services/mealImageUrl.js";
import {
  confirmPlannedMeal,
  createPlannedMeal,
  MealPlanValidationError,
  updatePlannedMeal,
} from "../services/mealPlan.js";
import {
  loadUserImageStorageFlags,
  normalizeMealCloudImageUrl,
  shouldUploadMealToCloud,
} from "../services/userFeatures.js";

export async function mealRoutes(app: FastifyInstance) {
  app.post(
    "/api/meals/upload",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No image provided" });
      }

      const buffer = await file.toBuffer();
      const mimeType = file.mimetype || "image/jpeg";

      try {
        await assertCanLogMeals(userId, userEmail);
        await reserveUploadAttempt(userId);
        validateUploadImage(buffer, mimeType);
        const { analysis, raw } = await analyzeMealImage(buffer, mimeType);

        const storageFlags = await loadUserImageStorageFlags(userId);
        let imageUrl = "";

        if (shouldUploadMealToCloud(storageFlags)) {
          try {
            imageUrl = await uploadMealImage(userId, buffer, mimeType);
          } catch (err) {
            request.log.error(err, "Cloud meal upload failed — continuing with device-only photo");
          }
        }

        const draftId = await saveDraft({
          userId,
          imageUrl,
          mimeType,
          analysis,
          rawAiResponse: raw,
        });
        const coachingContext = await buildCoachingContext(userId);
        const coachNudge = await generateCoachNudge(coachingContext, analysis);

        return {
          ...analysis,
          draftId,
          imageUrl,
          coachNudge,
        };
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof RateLimitError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post<{ Body: MealTextLogRequest }>(
    "/api/meals/log-text",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const description = request.body?.description?.trim() ?? "";

      if (!description) {
        return reply.code(400).send({ error: "description is required" });
      }
      if (description.length > 500) {
        return reply.code(400).send({ error: "description must be 500 characters or fewer" });
      }

      try {
        await assertCanLogMeals(userId, userEmail);
        await reserveUploadAttempt(userId);
        const { analysis, raw } = await analyzeMealText(description);

        const draftId = await saveDraft({
          userId,
          imageUrl: "",
          analysis,
          rawAiResponse: raw,
        });
        const coachingContext = await buildCoachingContext(userId);
        const coachNudge = await generateCoachNudge(coachingContext, analysis);

        return {
          ...analysis,
          draftId,
          imageUrl: "",
          coachNudge,
        };
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof RateLimitError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post<{ Body: MealRefineRequest }>(
    "/api/meals/refine",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { draftId, clarification } = request.body ?? {};

      if (!draftId?.trim() || !clarification?.trim()) {
        return reply.code(400).send({ error: "draftId and clarification are required" });
      }

      const draft = await getDraft(draftId, userId);
      if (!draft) {
        return reply.code(404).send({ error: "Draft not found or expired" });
      }

      if (!draftHasImage(draft)) {
        return reply.code(400).send({
          error: "Text-only meals can't be refined. Edit the meal details instead.",
        });
      }

      const { buffer, mimeType } = await getDraftImage(draft);
      try {
        await assertCanLogMeals(userId, userEmail);
        await reserveRefineAttempt(userId);
        const { analysis, raw } = await refineMealImage(
          buffer,
          mimeType,
          draft.analysis,
          clarification.trim(),
        );
        await updateDraftAnalysis(draftId, userId, analysis, raw);

        const coachingContext = await buildCoachingContext(userId);
        const coachNudge = await generateCoachNudge(coachingContext, analysis);

        return { ...analysis, coachNudge };
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof RateLimitError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { draftId: string } }>(
    "/api/meals/drafts/:draftId/photo",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { draftId } = request.params;

      const owned = await draftBelongsToUser(draftId, userId);
      if (!owned) {
        return reply.code(404).send({ error: "Draft not found or expired" });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No image provided" });
      }

      const buffer = await file.toBuffer();
      const mimeType = file.mimetype || "image/jpeg";

      try {
        await assertCanLogMeals(userId, userEmail);
        validateUploadImage(buffer, mimeType);
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }

      const storageFlags = await loadUserImageStorageFlags(userId);
      let imageUrl = "";

      if (shouldUploadMealToCloud(storageFlags)) {
        try {
          imageUrl = await uploadMealImage(userId, buffer, mimeType);
        } catch (err) {
          request.log.error(err, "Draft photo cloud upload failed — continuing with device-only photo");
        }
      }

      const updated = await updateDraftImage(draftId, userId, {
        imageUrl,
        mimeType,
      });
      if (!updated) {
        return reply.code(404).send({ error: "Draft not found or expired" });
      }

      return { imageUrl };
    },
  );

  app.post<{ Body: MealPlanRequest }>(
    "/api/meals/plan",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      try {
        const result = await createPlannedMeal(userId, request.body ?? ({} as MealPlanRequest));
        return result;
      } catch (err) {
        if (err instanceof MealPlanValidationError) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { id: string }; Body: MealConfirmPlannedRequest }>(
    "/api/meals/:id/confirm-planned",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params;
      try {
        return await confirmPlannedMeal(userId, id, request.body?.loggedAt);
      } catch (err) {
        if (err instanceof MealPlanValidationError) {
          const status = err.message === "Not found" ? 404 : 400;
          return reply.code(status).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Body: MealConfirmRequest }>(
    "/api/meals/confirm",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const body = request.body;
      const storageFlags = await loadUserImageStorageFlags(userId);

      const draft = body.draftId
        ? await getDraft(body.draftId, userId)
        : null;
      let imageUrl = normalizeMealCloudImageUrl(
        body.imageUrl?.trim() || draft?.imageUrl,
      );

      if (!imageUrl && draft && draftHasImage(draft)) {
        if (shouldUploadMealToCloud(storageFlags)) {
          try {
            const { buffer, mimeType } = await getDraftImage(draft);
            imageUrl = await uploadMealImage(userId, buffer, mimeType);
          } catch (err) {
            request.log.error(err, "Confirm-time cloud upload failed");
          }
        }
      }

      const mealType = body.mealType ?? inferMealType();
      const loggedAtDate = body.loggedAt ? new Date(body.loggedAt) : new Date();
      if (body.loggedAt) {
        if (
          Number.isNaN(loggedAtDate.getTime()) ||
          !isValidLogDateKeyForUser(
            dateKeyFromIso(loggedAtDate.toISOString()),
            storageFlags.isPaid,
          )
        ) {
          return reply.code(400).send({ error: "Invalid loggedAt" });
        }
      }
      const logDate = dateKeyFromIso(loggedAtDate.toISOString());

      try {
        await assertCanLogMeals(userId, userEmail);
        assertMealAnalysis({
          mealName: body.mealName,
          foods: body.foods,
          estimatedCalories: body.estimatedCalories,
          protein: body.protein,
          carbs: body.carbs,
          fat: body.fat,
          fibre: body.fibre,
          sugar: body.sugar,
          sodium: body.sodium,
          confidence: body.confidence,
        });
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const friendIds = await validateShareFriendIds(
          userId,
          body.shareWithFriendIds,
          client,
        );

        await client.query(
          `UPDATE meals SET sort_index = sort_index + 1
           WHERE user_id = $1 AND log_date = $2::date`,
          [userId, logDate],
        );
        const mealResult = await client.query<{ id: string }>(
          `INSERT INTO meals (
             user_id, meal_type, meal_name, image_url, created_at, log_date, sort_index,
             calories, protein, carbs, fat, fibre, sugar, sodium, confidence, foods,
             raw_ai_response, meal_source
           )
           VALUES ($1, $2, $3, $4, $5, $6::date, 0, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           RETURNING id`,
          [
            userId,
            mealType,
            body.mealName,
            imageUrl,
            loggedAtDate,
            logDate,
            body.estimatedCalories,
            body.protein,
            body.carbs,
            body.fat,
            body.fibre,
            body.sugar,
            body.sodium,
            body.confidence,
            body.foods,
            mergeRawAiPortionMeta(draft?.rawAiResponse, body.portionMeta),
            body.mealSource ?? null,
          ],
        );
        const mealId = mealResult.rows[0].id;

        const sharesSent = await createMealShareRequests(client, {
          fromUserId: userId,
          sourceMealId: mealId,
          friendIds,
          body,
          draftRawAi: draft?.rawAiResponse,
          mealType,
          imageUrl,
          logDate,
          loggedAt: loggedAtDate,
        });

        await client.query("COMMIT");
        await deleteDraft(body.draftId);

        await onMealDataChanged(userId, { mealLogDate: logDate });

        return { id: mealId, sharesSent };
      } catch (err) {
        await client.query("ROLLBACK");
        if (err instanceof MealShareError) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.get<{ Querystring: { view?: string; status?: string; from?: string; to?: string } }>(
    "/api/meals",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      const view = request.query.view ?? "summary";
      const statusFilter = request.query.status?.trim();
      const fromDate = request.query.from?.trim();
      const toDate = request.query.to?.trim();
      const { isPaid } = await loadUserImageStorageFlags(userId);

      const conditions = ["m.user_id = $1"];
      const params: unknown[] = [userId];
      let paramIndex = 2;

      if (statusFilter === "planned" || statusFilter === "logged") {
        conditions.push(`m.status = $${paramIndex}`);
        params.push(statusFilter);
        paramIndex += 1;
      }

      if (fromDate) {
        conditions.push(`m.log_date >= $${paramIndex}::date`);
        params.push(fromDate);
        paramIndex += 1;
      }

      if (toDate) {
        conditions.push(`m.log_date <= $${paramIndex}::date`);
        params.push(toDate);
        paramIndex += 1;
      }

      const whereClause = conditions.join(" AND ");

      if (view === "full") {
        const { rows } = await pool.query<{
          id: string;
          meal_type: string | null;
          meal_name: string;
          image_url: string;
          created_at: Date;
          log_date: string;
          sort_index: number;
          notes: string | null;
          status: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          fibre: number | null;
          sugar: number | null;
          sodium: number | null;
          confidence: string | null;
          foods: string[];
          shared_by_user_id: string | null;
          shared_by_name: string | null;
        }>(
          `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at,
                  m.log_date::text AS log_date, m.sort_index, m.notes, m.status,
                  m.calories, m.protein, m.carbs, m.fat, m.fibre, m.sugar, m.sodium,
                  m.confidence, m.foods, m.shared_by_user_id, sharer.name AS shared_by_name
           FROM meals m
           LEFT JOIN users sharer ON sharer.id = m.shared_by_user_id
           WHERE ${whereClause}
           ORDER BY m.log_date DESC, m.sort_index ASC
           LIMIT 100`,
          params,
        );

        const meals: MealListItem[] = await Promise.all(
          rows.map(async (r) => ({
            id: r.id,
            mealType: r.meal_type,
            mealName: r.meal_name,
            imageUrl: await mealListImageUrl(r.image_url, isPaid),
            createdAt: r.created_at.toISOString(),
            logDate: r.log_date,
            sortIndex: r.sort_index,
            status: r.status as MealListItem["status"],
            notes: r.notes,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
            fibre: r.fibre,
            sugar: r.sugar,
            sodium: r.sodium,
            confidence: r.confidence ? Number(r.confidence) : null,
            foods: r.foods ?? [],
            sharedByUserId: r.shared_by_user_id,
            sharedByName: r.shared_by_name,
          })),
        );

        return { meals };
      }

      const { rows } = await pool.query<{
        id: string;
        meal_type: string | null;
        meal_name: string;
        image_url: string;
        created_at: Date;
        log_date: string;
        sort_index: number;
        notes: string | null;
        status: string;
        calories: number | null;
        protein: number | null;
        fibre: number | null;
        shared_by_user_id: string | null;
        shared_by_name: string | null;
      }>(
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at,
                m.log_date::text AS log_date, m.sort_index, m.notes, m.status,
                m.calories, m.protein, m.fibre, m.shared_by_user_id, sharer.name AS shared_by_name
         FROM meals m
         LEFT JOIN users sharer ON sharer.id = m.shared_by_user_id
         WHERE ${whereClause}
         ORDER BY m.log_date DESC, m.sort_index ASC
         LIMIT 100`,
        params,
      );

      const meals: MealListSummary[] = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          mealType: r.meal_type,
          mealName: r.meal_name,
          imageUrl: await mealListImageUrl(r.image_url, isPaid),
          createdAt: r.created_at.toISOString(),
          logDate: r.log_date,
          sortIndex: r.sort_index,
          status: r.status as MealListSummary["status"],
          notes: r.notes,
          calories: r.calories,
          protein: r.protein,
          fibre: r.fibre,
          sharedByUserId: r.shared_by_user_id,
          sharedByName: r.shared_by_name,
        })),
      );

      return { meals };
    },
  );

  app.post<{ Body: MealReorderRequest }>(
    "/api/meals/reorder",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const dateKey = request.body?.dateKey?.trim() ?? "";
      const mealIds = request.body?.mealIds ?? [];
      const { isPaid } = await loadUserImageStorageFlags(userId);

      if (!isValidLogDateKeyForUser(dateKey, isPaid)) {
        return reply.code(400).send({ error: "Invalid dateKey" });
      }
      if (!Array.isArray(mealIds) || mealIds.length === 0) {
        return reply.code(400).send({ error: "mealIds is required" });
      }
      if (new Set(mealIds).size !== mealIds.length) {
        return reply.code(400).send({ error: "Duplicate mealIds" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        try {
          await reorderMealsForDay(client, userId, dateKey, mealIds);
        } catch (err) {
          await client.query("ROLLBACK");
          if (err instanceof ReorderMealsValidationError) {
            return reply.code(400).send({ error: err.message });
          }
          throw err;
        }
        await client.query("COMMIT");
        return { ok: true };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/meals/:id/photo",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params;

      const { rows } = await pool.query<{ image_url: string | null }>(
        `SELECT image_url FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      if (!rows[0]) {
        return reply.code(404).send({ error: "Not found" });
      }

      const previousImageUrl = rows[0].image_url?.trim() ?? "";

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No image provided" });
      }

      const buffer = await file.toBuffer();
      const mimeType = file.mimetype || "image/jpeg";

      try {
        validateUploadImage(buffer, mimeType);
      } catch (err) {
        if (err instanceof MealGuardrailError) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }

      const storageFlags = await loadUserImageStorageFlags(userId);
      let imageUrl = "";

      if (shouldUploadMealToCloud(storageFlags)) {
        try {
          imageUrl = await uploadMealImage(userId, buffer, mimeType);
        } catch (err) {
          request.log.error(err, "Meal photo cloud upload failed — continuing with device-only photo");
        }
      }

      await pool.query(
        `UPDATE meals SET image_url = $1 WHERE id = $2 AND user_id = $3`,
        [imageUrl, id, userId],
      );

      if (previousImageUrl) {
        await deleteStoredMealImage(previousImageUrl);
      }

      return { imageUrl };
    },
  );

  app.get(
    "/api/meals/:id/image",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };

      const flags = await loadUserImageStorageFlags(userId);
      if (!flags.isPaid) {
        return reply.code(403).send({
          error: "Cloud meal images require LifePlate Plus.",
          code: "PLUS_REQUIRED",
        });
      }

      const { rows } = await pool.query<{ image_url: string | null }>(
        `SELECT image_url FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const stored = rows[0]?.image_url;
      if (!stored?.trim()) {
        return { imageUrl: null };
      }

      const imageUrl = await resolveMealImageUrl(stored);
      return { imageUrl: imageUrl ?? (stored.startsWith("http") ? stored : null) };
    },
  );

  app.get(
    "/api/meals/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };

      const { rows } = await pool.query<{
        id: string;
        meal_type: string | null;
        meal_name: string;
        image_url: string;
        created_at: Date;
        log_date: string;
        sort_index: number;
        notes: string | null;
        calories: number | null;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
        fibre: number | null;
        sugar: number | null;
        sodium: number | null;
        confidence: string | null;
        foods: string[];
        raw_ai_response: unknown;
        reanalyze_count: number;
        shared_by_user_id: string | null;
        meal_source: string | null;
        status: string;
      }>(
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at,
                m.log_date::text AS log_date, m.sort_index, m.notes, m.status,
                m.calories, m.protein, m.carbs, m.fat, m.fibre, m.sugar, m.sodium,
                m.confidence, m.foods, m.raw_ai_response, m.reanalyze_count,
                m.shared_by_user_id, m.meal_source
         FROM meals m
         WHERE m.user_id = $1 AND m.id = $2`,
        [userId, id],
      );

      const r = rows[0];
      if (!r) return reply.code(404).send({ error: "Not found" });

      const portionMeta = extractMealPortionMeta(r.raw_ai_response);
      const imageUrl = (await resolveMealImageUrl(r.image_url)) ?? r.image_url?.trim() ?? "";
      const pendingShareFriendIds = await fetchPendingShareFriendIdsForMeal(userId, id);

      return {
        id: r.id,
        mealType: r.meal_type,
        mealName: r.meal_name,
        imageUrl,
        createdAt: r.created_at.toISOString(),
        logDate: r.log_date,
        sortIndex: r.sort_index,
        status: r.status,
        notes: r.notes,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fibre: r.fibre,
        sugar: r.sugar,
        sodium: r.sodium,
        confidence: r.confidence ? Number(r.confidence) : null,
        foods: r.foods ?? [],
        portionMeta,
        reanalyzeCount: r.reanalyze_count,
        reanalyzeRemaining: mealReanalyzeRemaining(r.reanalyze_count),
        sharedByUserId: r.shared_by_user_id,
        mealSource: r.meal_source,
        pendingShareFriendIds,
      };
    },
  );

  app.post<{ Body: MealReanalyzeRequest; Params: { id: string } }>(
    "/api/meals/:id/reanalyze",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { id } = request.params;
      const body = request.body ?? {};
      const foods = (body.foods ?? []).map((food) => food.trim()).filter(Boolean);

      if (!foods.length) {
        return reply.code(400).send({ error: "At least one food is required" });
      }

      const { rows: ownedRows } = await pool.query<{
        meal_name: string;
        meal_type: string | null;
        reanalyze_count: number;
      }>(
        `SELECT meal_name, meal_type, reanalyze_count
         FROM meals
         WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const owned = ownedRows[0];
      if (!owned) {
        return reply.code(404).send({ error: "Not found" });
      }

      try {
        await assertCanLogMeals(userId, userEmail);
        assertMealReanalyzeAllowed(owned.reanalyze_count);
        await reserveRefineAttempt(userId);
        const { analysis } = await reanalyzeMealFromFoods({
          mealName: body.mealName?.trim() || owned.meal_name,
          mealType: body.mealType ?? owned.meal_type,
          foods,
        });

        const { rows: updatedRows } = await pool.query<{ reanalyze_count: number }>(
          `UPDATE meals
           SET reanalyze_count = reanalyze_count + 1
           WHERE id = $1 AND user_id = $2 AND reanalyze_count < $3
           RETURNING reanalyze_count`,
          [id, userId, MAX_MEAL_REANALYZES],
        );
        if (!updatedRows[0]) {
          throw new MealGuardrailError(
            "REANALYZE_LIMIT",
            `You've used all ${MAX_MEAL_REANALYZES} AI re-analyses for this meal.`,
            429,
          );
        }

        return {
          ...analysis,
          reanalyzeRemaining: mealReanalyzeRemaining(updatedRows[0].reanalyze_count),
        };
      } catch (err) {
        if (
          err instanceof MealGuardrailError ||
          err instanceof RateLimitError ||
          err instanceof FreeTierError ||
          err instanceof UserProfileNotReadyError
        ) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { id: string }; Body: MealShareExistingRequest }>(
    "/api/meals/:id/share",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params;

      try {
        const result = await shareExistingMealWithFriends(
          userId,
          id,
          request.body?.shareWithFriendIds,
        );
        return result;
      } catch (err) {
        if (err instanceof MealShareError) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  app.patch<{ Body: MealUpdateRequest }>(
    "/api/meals/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };
      const body = request.body ?? {};
      const { isPaid } = await loadUserImageStorageFlags(userId);

      if (
        body.mealSource !== undefined &&
        body.mealSource !== null &&
        !isMealSource(body.mealSource)
      ) {
        return reply.code(400).send({ error: "Invalid mealSource" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const owned = await client.query<{
          id: string;
          log_date: string;
          status: string;
          raw_ai_response: unknown;
        }>(
          `SELECT id, log_date::text AS log_date, status, raw_ai_response
           FROM meals
           WHERE id = $1 AND user_id = $2`,
          [id, userId],
        );
        if (!owned.rows[0]) {
          await client.query("ROLLBACK");
          return reply.code(404).send({ error: "Not found" });
        }
        const previousLogDate = owned.rows[0].log_date;
        const mealStatus = owned.rows[0].status;
        let nextLogDate = previousLogDate;

        if (body.loggedAt !== undefined) {
          const parsed = new Date(body.loggedAt);
          const logDate = dateKeyFromIso(parsed.toISOString());
          const dateValid =
            mealStatus === "planned"
              ? isValidPlanDateKey(logDate) || isValidLogDateKeyForUser(logDate, isPaid)
              : isValidLogDateKeyForUser(logDate, isPaid);
          if (Number.isNaN(parsed.getTime()) || !dateValid) {
            await client.query("ROLLBACK");
            return reply.code(400).send({ error: "Invalid loggedAt" });
          }
          const statusClause =
            mealStatus === "planned" ? "status = 'planned'" : "status = 'logged'";
          await client.query(
            `UPDATE meals SET sort_index = sort_index + 1
             WHERE user_id = $1 AND log_date = $2::date AND id != $3 AND ${statusClause}`,
            [userId, logDate, id],
          );
          await client.query(
            `UPDATE meals
             SET created_at = $1, log_date = $2::date, sort_index = 0
             WHERE id = $3 AND user_id = $4`,
            [parsed, logDate, id, userId],
          );
          nextLogDate = logDate;
        }

        if (
          body.mealName !== undefined ||
          body.mealType !== undefined ||
          body.notes !== undefined ||
          body.mealSource !== undefined
        ) {
          await client.query(
            `UPDATE meals
             SET meal_name = COALESCE($1, meal_name),
                 meal_type = COALESCE($2, meal_type),
                 notes = CASE WHEN $5 THEN $3 ELSE notes END,
                 meal_source = CASE WHEN $7 THEN $6 ELSE meal_source END
             WHERE id = $4 AND user_id = $8`,
            [
              body.mealName ?? null,
              body.mealType ?? null,
              normalizeMealNotes(body.notes),
              id,
              body.notes !== undefined,
              body.mealSource ?? null,
              body.mealSource !== undefined,
              userId,
            ],
          );
        }

        if (
          body.calories !== undefined ||
          body.protein !== undefined ||
          body.carbs !== undefined ||
          body.fat !== undefined ||
          body.fibre !== undefined ||
          body.sugar !== undefined ||
          body.sodium !== undefined
        ) {
          const macroParams = [
            roundOptionalMealMacro(body.calories) ?? null,
            roundOptionalMealMacro(body.protein) ?? null,
            roundOptionalMealMacro(body.carbs) ?? null,
            roundOptionalMealMacro(body.fat) ?? null,
            roundOptionalMealMacro(body.fibre) ?? null,
            roundOptionalMealMacro(body.sugar) ?? null,
            roundOptionalMealMacro(body.sodium) ?? null,
            id,
            userId,
          ];
          await client.query(
            `UPDATE meals
             SET calories = COALESCE($1, calories),
                 protein = COALESCE($2, protein),
                 carbs = COALESCE($3, carbs),
                 fat = COALESCE($4, fat),
                 fibre = COALESCE($5, fibre),
                 sugar = COALESCE($6, sugar),
                 sodium = COALESCE($7, sodium)
             WHERE id = $8 AND user_id = $9`,
            macroParams,
          );
        }

        if (body.foods) {
          await client.query(
            `UPDATE meals SET foods = $1 WHERE id = $2 AND user_id = $3`,
            [body.foods, id, userId],
          );
        }

        if (body.portionMeta !== undefined) {
          await client.query(
            `UPDATE meals
             SET raw_ai_response = $1::jsonb
             WHERE id = $2 AND user_id = $3`,
            [
              mergeRawAiPortionMeta(owned.rows[0].raw_ai_response, body.portionMeta),
              id,
              userId,
            ],
          );
        }

        await client.query("COMMIT");
        await onMealDataChanged(userId, {
          mealLogDate: nextLogDate,
          previousMealLogDate:
            body.loggedAt !== undefined && nextLogDate !== previousLogDate
              ? previousLogDate
              : undefined,
        });

        const patch: MealPatchResponse = { id };
        if (body.mealName !== undefined) patch.mealName = body.mealName;
        if (body.mealType !== undefined) patch.mealType = body.mealType;
        if (body.foods !== undefined) patch.foods = body.foods;
        if (body.calories !== undefined) patch.calories = body.calories;
        if (body.protein !== undefined) patch.protein = body.protein;
        if (body.carbs !== undefined) patch.carbs = body.carbs;
        if (body.fat !== undefined) patch.fat = body.fat;
        if (body.fibre !== undefined) patch.fibre = body.fibre;
        if (body.sugar !== undefined) patch.sugar = body.sugar;
        if (body.sodium !== undefined) patch.sodium = body.sodium;
        if (body.mealSource !== undefined) patch.mealSource = body.mealSource;
        return patch;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.delete(
    "/api/meals/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };

      const { rows } = await pool.query<{ log_date: string }>(
        `SELECT log_date::text AS log_date FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      if (!rows[0]) return reply.code(404).send({ error: "Not found" });

      const mealLogDate = rows[0].log_date;

      const { rowCount } = await pool.query(
        `DELETE FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (!rowCount) return reply.code(404).send({ error: "Not found" });
      await onMealDataChanged(userId, { mealLogDate });
      return { ok: true };
    },
  );
}
