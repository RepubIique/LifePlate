import type { FastifyInstance } from "fastify";
import type { CoopChallengeInviteRequest } from "@lifeplate/shared";
import { computeNutritionTargets } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";
import {
  acceptCoopChallenge,
  applyStreakFreeze,
  CoopChallengeError,
  declineCoopChallenge,
  inviteCoopChallenge,
} from "../services/coopChallenges.js";
import { getGamificationBundle } from "../services/gamificationBundle.js";

async function hydrationTargetForUser(userId: string): Promise<number> {
  const { rows } = await pool.query<{
    goal: string | null;
    weight_kg: string | null;
    height_cm: string | null;
    age: number | null;
    gender: string | null;
  }>(
    `SELECT goal, weight_kg, height_cm, age, gender FROM users WHERE id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return 8;
  const targets = computeNutritionTargets(
    {
      weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
      heightCm: row.height_cm != null ? Number(row.height_cm) : null,
      age: row.age,
      gender:
        row.gender === "female" || row.gender === "male" || row.gender === "unspecified"
          ? row.gender
          : null,
    },
    row.goal,
  );
  return targets?.dailyHydrationGlasses ?? 8;
}

export async function gamificationRoutes(app: FastifyInstance) {
  app.get("/api/gamification", { preHandler: requireAuth }, async (request) => {
    const { userId } = request as AuthedRequest;
    const target = await hydrationTargetForUser(userId);
    return getGamificationBundle(userId, target);
  });

  app.post<{ Body: CoopChallengeInviteRequest }>(
    "/api/gamification/coop-challenges/invite",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      try {
        const challenge = await inviteCoopChallenge(userId, request.body ?? { friendId: "", challengeType: "hydration_5_of_7" });
        return { challenge };
      } catch (err) {
        if (err instanceof CoopChallengeError) {
          return reply.code(err.status).send({ error: err.message, code: err.code, message: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/gamification/coop-challenges/:id/accept",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      try {
        const challenge = await acceptCoopChallenge(userId, request.params.id);
        return { challenge };
      } catch (err) {
        if (err instanceof CoopChallengeError) {
          return reply.code(err.status).send({ error: err.message, code: err.code, message: err.message });
        }
        throw err;
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/gamification/coop-challenges/:id/decline",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request as AuthedRequest;
      try {
        await declineCoopChallenge(userId, request.params.id);
        return { ok: true };
      } catch (err) {
        if (err instanceof CoopChallengeError) {
          return reply.code(err.status).send({ error: err.message, code: err.code, message: err.message });
        }
        throw err;
      }
    },
  );

  app.post("/api/gamification/streak-freeze", { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request as AuthedRequest;
    const { rows } = await pool.query<{ is_paid: boolean }>(
      `SELECT is_paid FROM users WHERE id = $1`,
      [userId],
    );
    try {
      const result = await applyStreakFreeze(userId, rows[0]?.is_paid ?? false);
      return result;
    } catch (err) {
      if (err instanceof CoopChallengeError) {
        return reply.code(err.status).send({ error: err.message, code: err.code, message: err.message });
      }
      throw err;
    }
  });
}
