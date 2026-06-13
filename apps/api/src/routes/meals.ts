import type { FastifyInstance } from "fastify";
import type {
  MealConfirmRequest,
  MealListItem,
  MealRefineRequest,
  MealUpdateRequest,
} from "@lifeplate/shared";
import { inferMealType } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";
import { buildCoachingContext, generateCoachNudge } from "../services/coaching.js";
import { saveDraft, getDraft, deleteDraft, updateDraftAnalysis } from "../services/drafts.js";
import { imageUrlToBuffer } from "../services/imageFetch.js";
import { analyzeMealImage, refineMealImage } from "../services/openai.js";
import { uploadMealImage } from "../services/storage.js";

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

      let imageUrl: string;
      try {
        imageUrl = await uploadMealImage(userId, buffer, mimeType);
      } catch (err) {
        request.log.error(err);
        imageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }

      const { analysis, raw } = await analyzeMealImage(buffer, mimeType);
      const draftId = saveDraft(userId, imageUrl, analysis, raw);
      const coachingContext = await buildCoachingContext(userId);
      const coachNudge = await generateCoachNudge(coachingContext, analysis);

      return {
        ...analysis,
        draftId,
        imageUrl,
        coachNudge,
      };
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

      const draft = getDraft(draftId, userId);
      if (!draft) {
        return reply.code(404).send({ error: "Draft not found or expired" });
      }

      const { buffer, mimeType } = await imageUrlToBuffer(draft.imageUrl);
      const { analysis, raw } = await refineMealImage(
        buffer,
        mimeType,
        draft.analysis,
        clarification.trim(),
      );
      updateDraftAnalysis(draftId, userId, analysis, raw);

      const coachingContext = await buildCoachingContext(userId);
      const coachNudge = await generateCoachNudge(coachingContext, analysis);

      return { ...analysis, coachNudge };
    },
  );

  app.post<{ Body: MealConfirmRequest }>(
    "/api/meals/confirm",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const body = request.body;

      const draft = body.draftId ? getDraft(body.draftId, userId) : null;

      const mealType = body.mealType ?? inferMealType();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        const mealResult = await client.query<{ id: string }>(
          `INSERT INTO meals (user_id, meal_type, meal_name, image_url)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [userId, mealType, body.mealName, body.imageUrl],
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
            JSON.stringify(draft?.rawAiResponse ?? body),
          ],
        );

        for (const food of body.foods) {
          await client.query(
            `INSERT INTO foods (meal_id, food_name) VALUES ($1, $2)`,
            [mealId, food],
          );
        }

        await client.query("COMMIT");
        deleteDraft(body.draftId);

        return { id: mealId, mealType, ...body };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  );

  app.get(
    "/api/meals",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      const { rows } = await pool.query<{
        id: string;
        meal_type: string | null;
        meal_name: string;
        image_url: string;
        created_at: Date;
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
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at,
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

      const meals: MealListItem[] = rows.map((r) => ({
        id: r.id,
        mealType: r.meal_type,
        mealName: r.meal_name,
        imageUrl: r.image_url,
        createdAt: r.created_at.toISOString(),
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fibre: r.fibre,
        sugar: r.sugar,
        sodium: r.sodium,
        confidence: r.confidence ? Number(r.confidence) : null,
        foods: r.foods ?? [],
      }));

      return { meals };
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
        `SELECT m.id, m.meal_type, m.meal_name, m.image_url, m.created_at,
                a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence,
                COALESCE(array_agg(f.food_name) FILTER (WHERE f.food_name IS NOT NULL), '{}') AS foods
         FROM meals m
         LEFT JOIN meal_analysis a ON a.meal_id = m.id
         LEFT JOIN foods f ON f.meal_id = m.id
         WHERE m.user_id = $1 AND m.id = $2
         GROUP BY m.id, a.calories, a.protein, a.carbs, a.fat, a.fibre, a.sugar, a.sodium, a.confidence`,
        [userId, id],
      );

      const r = rows[0];
      if (!r) return reply.code(404).send({ error: "Not found" });

      return {
        id: r.id,
        mealType: r.meal_type,
        mealName: r.meal_name,
        imageUrl: r.image_url,
        createdAt: r.created_at.toISOString(),
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fibre: r.fibre,
        sugar: r.sugar,
        sodium: r.sodium,
        confidence: r.confidence ? Number(r.confidence) : null,
        foods: r.foods ?? [],
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

        const owned = await client.query<{ id: string }>(
          `SELECT id FROM meals WHERE id = $1 AND user_id = $2`,
          [id, userId],
        );
        if (!owned.rows[0]) {
          await client.query("ROLLBACK");
          return reply.code(404).send({ error: "Not found" });
        }

        if (
          body.mealName !== undefined ||
          body.mealType !== undefined
        ) {
          await client.query(
            `UPDATE meals
             SET meal_name = COALESCE($1, meal_name),
                 meal_type = COALESCE($2, meal_type)
             WHERE id = $3 AND user_id = $4`,
            [
              body.mealName ?? null,
              body.mealType ?? null,
              id,
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

  app.delete(
    "/api/meals/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params as { id: string };

      const { rowCount } = await pool.query(
        `DELETE FROM meals WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );

      if (!rowCount) return reply.code(404).send({ error: "Not found" });
      return { ok: true };
    },
  );
}
