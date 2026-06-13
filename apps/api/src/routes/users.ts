import type { FastifyInstance } from "fastify";
import type { UserProfile } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";

function computeStreaks(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const daySet = new Set(
    dates.map((d) => d.toISOString().slice(0, 10)),
  );
  const sortedDays = [...daySet].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  let current = 0;
  let cursor = new Date(today);
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}

export async function userRoutes(app: FastifyInstance) {
  app.get(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request) => {
      const { userId, userEmail } = request as AuthedRequest;

      const { rows } = await pool.query<{
        id: string;
        email: string;
        name: string | null;
        goal: string | null;
      }>(`SELECT id, email, name, goal FROM users WHERE id = $1`, [userId]);

      const user = rows[0];
      const { rows: mealDates } = await pool.query<{ created_at: Date }>(
        `SELECT created_at FROM meals WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );

      const { current, longest } = computeStreaks(
        mealDates.map((m) => m.created_at),
      );

      const profile: UserProfile = {
        id: userId,
        email: user?.email ?? userEmail,
        name: user?.name ?? null,
        goal: user?.goal ?? null,
        mealsLogged: mealDates.length,
        currentStreak: current,
        longestStreak: longest,
      };

      return profile;
    },
  );

  app.patch<{ Body: { goal?: string; name?: string } }>(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { goal, name } = request.body ?? {};

      if (goal !== undefined) {
        await pool.query(
          `INSERT INTO users (id, email, goal)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET goal = EXCLUDED.goal`,
          [userId, userEmail, goal],
        );
      }
      if (name !== undefined) {
        await pool.query(
          `INSERT INTO users (id, email, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [userId, userEmail, name],
        );
      }

      return { ok: true };
    },
  );
}
