import type { FastifyInstance } from "fastify";
import type { MealShareAcceptRequest } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import {
  MealShareError,
  acceptMealShare,
  countIncomingMealShares,
  declineMealShare,
  listIncomingMealShares,
} from "../services/mealShare.js";

export async function mealShareRoutes(app: FastifyInstance) {
  app.get("/api/meal-shares/incoming", { preHandler: requireAuth }, async (request) => {
    const { userId } = request as AuthedRequest;
    const shares = await listIncomingMealShares(userId);
    return { shares };
  });

  app.get("/api/meal-shares/incoming/count", { preHandler: requireAuth }, async (request) => {
    const { userId } = request as AuthedRequest;
    const count = await countIncomingMealShares(userId);
    return { count };
  });

  app.post<{ Params: { id: string }; Body: MealShareAcceptRequest }>(
    "/api/meal-shares/:id/accept",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params;

      try {
        const result = await acceptMealShare(userId, id, request.body?.portionMeta);
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

  app.post<{ Params: { id: string } }>(
    "/api/meal-shares/:id/decline",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { id } = request.params;

      try {
        await declineMealShare(userId, id);
        return { ok: true };
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
}
