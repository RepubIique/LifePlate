import type { FastifyInstance } from "fastify";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import {
  buildNutritionDashboard,
  updateHydrationGlasses,
} from "../services/nutritionDashboard.js";

export async function nutritionRoutes(app: FastifyInstance) {
  app.get(
    "/api/nutrition/dashboard",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      return buildNutritionDashboard(userId);
    },
  );

  app.patch(
    "/api/nutrition/hydration",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const body = request.body as { glasses?: number };

      if (body.glasses == null || !Number.isFinite(body.glasses)) {
        return reply.status(400).send({ error: "glasses is required" });
      }

      const glasses = await updateHydrationGlasses(userId, body.glasses);
      return { glasses };
    },
  );
}
