import type { FastifyInstance } from "fastify";
import { isValidLogDateKey } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import {
  buildNutritionDashboard,
  fetchHydrationHistory,
  updateHydrationGlasses,
} from "../services/nutritionDashboard.js";

export async function nutritionRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { date?: string } }>(
    "/api/nutrition/dashboard",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const dateKey = request.query.date?.trim();
      if (dateKey && !isValidLogDateKey(dateKey)) {
        return reply.status(400).send({ error: "Invalid date" });
      }
      return buildNutritionDashboard(userId, dateKey);
    },
  );

  app.get<{ Querystring: { days?: string } }>(
    "/api/nutrition/hydration",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      const parsed = request.query.days ? Number(request.query.days) : 60;
      const days = Number.isFinite(parsed)
        ? Math.min(90, Math.max(1, Math.floor(parsed)))
        : 60;
      const history = await fetchHydrationHistory(userId, days);
      return { days: history };
    },
  );

  app.patch(
    "/api/nutrition/hydration",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const body = request.body as { glasses?: number; date?: string };

      if (body.glasses == null || !Number.isFinite(body.glasses)) {
        return reply.status(400).send({ error: "glasses is required" });
      }

      const dateKey = body.date?.trim();
      if (dateKey && !isValidLogDateKey(dateKey)) {
        return reply.status(400).send({ error: "Invalid date" });
      }

      const result = await updateHydrationGlasses(userId, body.glasses, dateKey);
      return result;
    },
  );
}
