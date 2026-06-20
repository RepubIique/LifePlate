import type { FastifyInstance } from "fastify";
import type {
  MealConfirmRequest,
  MealListItem,
  MealListSummary,
  MealPatchResponse,
  MealRefineRequest,
  MealTextLogRequest,
  MealUpdateRequest,
} from "@lifeplate/shared";
import { dateKeyFromIso, inferMealType, isValidLogDateKey, normalizeMealNotes } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";
import { buildCoachingContext, generateCoachNudge } from "../services/coaching.js";
import { getDraft, deleteDraft, updateDraftAnalysis, getDraftImage, saveDraft } from "../services/drafts.js";
import { validateUploadImage } from "../services/imageValidation.js";
import { MealGuardrailError, assertMealAnalysis } from "../services/mealGuardrails.js";
import { RateLimitError, reserveRefineAttempt, reserveUploadAttempt } from "../services/uploadRateLimit.js";
import { analyzeMealImage, analyzeMealText, refineMealImage } from "../services/openai.js";
import { onMealDataChanged } from "../services/mealSideEffects.js";
import { extractMealPortionMeta, mergeRawAiPortionMeta } from "../services/mealPortions.js";
import { uploadMealImage } from "../services/storage.js";
import { resolveMealImageUrl, mealListImageUrl } from "../services/mealImageUrl.js";
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
      const { userId } = request as AuthedRequest;
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No image provided" });
      }

      const buffer = await file.toBuffer();
      const mimeType = file.mimetype || "image/jpeg";

      try {
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
          imageBuffer: buffer,
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
        if (err instanceof MealGuardrailError || err instanceof RateLimitError) {
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
      const { userId } = request as AuthedRequest;
      const description = request.body?.description?.trim() ?? "";

      if (!description) {
        return reply.code(400).send({ error: "description is required" });
      }
      if (description.length > 500) {
        return reply.code(400).send({ error: "description must be 500 characters or fewer" });
      }

      try {
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
        if (err instanceof MealGuardrailError || err instanceof RateLimitError) {
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
      const { userId } = request as AuthedRequest;
      const { draftId, clarification } = request.body ?? {};

      if (!draftId?.trim() || !clarification?.trim()) {
        return reply.code(400).send({ error: "draftId and clarification are required" });
      }

      const draft = await getDraft(draftId, userId);
      if (!draft) {
        return reply.code(404).send({ error: "Draft not found or expired" });
      }

      if (!draft.imageBuffer && !draft.imageUrl?.trim()) {
        return reply.code(400).send({
          error: "Text-only meals can't be refined. Edit the meal details instead.",
        });
      }

      const { buffer, mimeType } = await getDraftImage(draft);
      try {
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
        if (err instanceof MealGuardrailError || err instanceof RateLimitError) {
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

  app.post<{ Body: MealConfirmRequest }>(
    "/api/meals/confirm",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const body = request.body;

      const draft = body.draftId ? await getDraft(body.draftId, userId) : null;
      let imageUrl = normalizeMealCloudImageUrl(
        body.imageUrl?.trim() || draft?.imageUrl,
      );

      if (!imageUrl && draft) {
        const storageFlags = await loadUserImageStorageFlags(userId);
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
      let loggedAt: Date | null = null;
      if (body.loggedAt) {
        loggedAt = new Date(body.loggedAt);
        if (Number.isNaN(loggedAt.getTime()) || !isValidLogDateKey(dateKeyFromIso(loggedAt.toISOString()))) {
          return reply.code(400).send({ error: "Invalid loggedAt" });
        }
      }

      try {
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
        if (err instanceof MealGuardrailError) {
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
        const mealResult = await client.query<{ id: string }>(
          `INSERT INTO meals (user_id, meal_type, meal_name, image_url, created_at)
           VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()))
           RETURNING id`,
          [userId, mealType, body.mealName, imageUrl, loggedAt],
        );
        const mealId = mealResult.rows[0].id;

        await client.query(
          `INSERT INTO meal_analysis (meal_id, calories, protein, carbs, fat, fibre, sugar, sodium, confidence, raw_ai_response)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            mealId,
            body.estimatedCalories,
            body.protein,
            body.carbs,
            body.fat,
            body.fibre,
            body.sugar,
            body.sodium,
            body.confidence,
            mergeRawAiPortionMeta(draft?.rawAiResponse, body.portionMeta),
          ],
        );

        for (const food of body.foods) {
          await client.query(
            `INSERT INTO foods (meal_id, food_name) VALUES ($1, $2)`,
            [mealId, food],
          );
        }

        await client.query("COMMIT");
        await deleteDraft(body.draftId);

        await onMealDataChanged(userId, { mealCreatedAt: loggedAt ?? new Date() });

        return { id: mealId };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.get<{ Querystring: { view?: string } }>(
    "/api/meals",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      const view = request.query.view ?? "summary";
      const { isPaid } = await loadUserImageStorageFlags(userId);

      if (view === "full") {
        const { rows } = await pool.query<{
          id: string;
          meal_type: string | null;
          meal_name: string;
          image_url: string;
          created_at: Date;
          notes: string | null;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          fibre: number | null;
          sugar: number | null;
          sodium: number | null;
          confidence: string | null;
          foods: string[] | null;
        }>(
          `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at, m.notes,
                  a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence,
                  COALESCE(array_agg(f.food_name) FILTER (WHERE f.food_name IS NOT NULL), '{}') AS foods
           FROM meals m
           LEFT JOIN meal_analysis a ON a.meal_id = m.id
           LEFT JOIN foods f ON f.meal_id = m.id
           WHERE m.user_id = $1
           GROUP BY m.id, a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence
           ORDER BY m.created_at DESC
           LIMIT 100`,
          [userId],
        );

        const meals: MealListItem[] = await Promise.all(
          rows.map(async (r) => ({
            id: r.id,
            mealType: r.meal_type,
            mealName: r.meal_name,
            imageUrl: await mealListImageUrl(r.image_url, isPaid),
            createdAt: r.created_at.toISOString(),
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
        notes: string | null;
        calories: number | null;
        protein: number | null;
      }>(
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at, m.notes,
                a.calories, a.protein
         FROM meals m
         LEFT JOIN meal_analysis a ON a.meal_id = m.id
         WHERE m.user_id = $1
         ORDER BY m.created_at DESC
         LIMIT 100`,
        [userId],
      );

      const meals: MealListSummary[] = await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          mealType: r.meal_type,
          mealName: r.meal_name,
          imageUrl: await mealListImageUrl(r.image_url, isPaid),
          createdAt: r.created_at.toISOString(),
          notes: r.notes,
          calories: r.calories,
          protein: r.protein,
        })),
      );

      return { meals };
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
        notes: string | null;
        calories: number | null;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
        fibre: number | null;
        sugar: number | null;
        sodium: number | null;
        confidence: string | null;
        foods: string[] | null;
        raw_ai_response: unknown;
      }>(
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at, m.notes,
                a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence,
                a.raw_ai_response,
                COALESCE(array_agg(f.food_name) FILTER (WHERE f.food_name IS NOT NULL), '{}') AS foods
         FROM meals m
         LEFT JOIN meal_analysis a ON a.meal_id = m.id
         LEFT JOIN foods f ON f.meal_id = m.id
         WHERE m.user_id = $1 AND m.id = $2
         GROUP BY m.id, a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence, a.raw_ai_response`,
        [userId, id],
      );

      const r = rows[0];
      if (!r) return reply.code(404).send({ error: "Not found" });

      const portionMeta = extractMealPortionMeta(r.raw_ai_response);
      const imageUrl = (await resolveMealImageUrl(r.image_url)) ?? r.image_url?.trim() ?? "";

      return {
        id: r.id,
        mealType: r.meal_type,
        mealName: r.meal_name,
        imageUrl,
        createdAt: r.created_at.toISOString(),
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
      };
    },
  );

  app.patch<{ Body: MealUpdateRequest }>(
    "/api/meals/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };
      const body = request.body ?? {};

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const owned = await client.query<{
          id: string;
          created_at: Date;
          raw_ai_response: unknown;
        }>(
          `SELECT m.id, m.created_at, a.raw_ai_response
           FROM meals m
           LEFT JOIN meal_analysis a ON a.meal_id = m.id
           WHERE m.id = $1 AND m.user_id = $2`,
          [id, userId],
        );
        if (!owned.rows[0]) {
          await client.query("ROLLBACK");
          return reply.code(404).send({ error: "Not found" });
        }
        const mealCreatedAt = owned.rows[0].created_at;
        let nextCreatedAt = mealCreatedAt;

        if (body.loggedAt !== undefined) {
          const parsed = new Date(body.loggedAt);
          if (Number.isNaN(parsed.getTime()) || !isValidLogDateKey(dateKeyFromIso(parsed.toISOString()))) {
            await client.query("ROLLBACK");
            return reply.code(400).send({ error: "Invalid loggedAt" });
          }
          await client.query(
            `UPDATE meals SET created_at = $1 WHERE id = $2 AND user_id = $3`,
            [parsed, id, userId],
          );
          nextCreatedAt = parsed;
        }

        if (
          body.mealName !== undefined ||
          body.mealType !== undefined ||
          body.notes !== undefined
        ) {
          await client.query(
            `UPDATE meals
             SET meal_name = COALESCE($1, meal_name),
                 meal_type = COALESCE($2, meal_type),
                 notes = CASE WHEN $5 THEN $3 ELSE notes END
             WHERE id = $4 AND user_id = $6`,
            [
              body.mealName ?? null,
              body.mealType ?? null,
              normalizeMealNotes(body.notes),
              id,
              body.notes !== undefined,
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
          await client.query(
            `UPDATE meal_analysis
             SET calories = COALESCE($1, calories),
                 protein = COALESCE($2, protein),
                 carbs = COALESCE($3, carbs),
                 fat = COALESCE($4, fat),
                 fibre = COALESCE($5, fibre),
                 sugar = COALESCE($6, sugar),
                 sodium = COALESCE($7, sodium)
             WHERE meal_id = $8`,
            [
              body.calories ?? null,
              body.protein ?? null,
              body.carbs ?? null,
              body.fat ?? null,
              body.fibre ?? null,
              body.sugar ?? null,
              body.sodium ?? null,
              id,
            ],
          );
        }

        if (body.foods) {
          await client.query(`DELETE FROM foods WHERE meal_id = $1`, [id]);
          for (const food of body.foods) {
            await client.query(
              `INSERT INTO foods (meal_id, food_name) VALUES ($1, $2)`,
              [id, food],
            );
          }
        }

        if (body.portionMeta !== undefined) {
          await client.query(
            `UPDATE meal_analysis
             SET raw_ai_response = $1::jsonb
             WHERE meal_id = $2`,
            [
              mergeRawAiPortionMeta(owned.rows[0].raw_ai_response, body.portionMeta),
              id,
            ],
          );
        }

        await client.query("COMMIT");
        await onMealDataChanged(userId, {
          mealCreatedAt: nextCreatedAt,
          previousMealCreatedAt: mealCreatedAt,
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

      const { rows } = await pool.query<{ created_at: Date }>(
        `SELECT created_at FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      if (!rows[0]) return reply.code(404).send({ error: "Not found" });

      const mealCreatedAt = rows[0].created_at;

      const { rowCount } = await pool.query(
        `DELETE FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (!rowCount) return reply.code(404).send({ error: "Not found" });
      await onMealDataChanged(userId, { mealCreatedAt });
      return { ok: true };
    },
  );
}
