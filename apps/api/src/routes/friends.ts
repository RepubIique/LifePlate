import type { FastifyInstance } from "fastify";
import type { AddFriendRequest } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import {
  FriendRequestError,
  addFriendByCode,
  getFriendsSocialResponse,
  removeFriend,
} from "../services/friendships.js";

export async function friendRoutes(app: FastifyInstance) {
  app.get("/api/friends", { preHandler: requireAuth }, async (request) => {
    const { userId } = request as AuthedRequest;
    return getFriendsSocialResponse(userId);
  });

  app.post<{ Body: AddFriendRequest }>(
    "/api/friends/add",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const friendCode = request.body?.friendCode ?? "";

      try {
        const friend = await addFriendByCode(userId, friendCode);
        return { friend };
      } catch (err) {
        if (err instanceof FriendRequestError) {
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

  app.delete<{ Params: { friendId: string } }>(
    "/api/friends/:friendId",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      const { friendId } = request.params;

      try {
        await removeFriend(userId, friendId);
        return { ok: true };
      } catch (err) {
        if (err instanceof FriendRequestError) {
          return reply.code(err.status).send({ error: err.message, code: err.code });
        }
        throw err;
      }
    },
  );
}
