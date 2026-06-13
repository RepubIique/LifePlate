import type { FastifyInstance } from "fastify";
import { computeNutritionTargets, type UserProfile } from "@lifeplate/shared";
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

function toProfile(
  userId: string,
  userEmail: string,
  row: {
    email: string;
    name: string | null;
    goal: string | null;
    weight_kg: string | null;
    height_cm: string | null;
    age: number | null;
  },
  mealsLogged: number,
  streaks: { current: number; longest: number },
): UserProfile {
  const weightKg = row.weight_kg != null ? Number(row.weight_kg) : null;
  const heightCm = row.height_cm != null ? Number(row.height_cm) : null;
  const age = row.age;

  return {
    id: userId,
    email: row.email ?? userEmail,
    name: row.name,
    goal: row.goal,
    weightKg,
    heightCm,
    age,
    nutritionTargets: computeNutritionTargets({ weightKg, heightCm, age }),
    mealsLogged,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
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
        weight_kg: string | null;
        height_cm: string | null;
        age: number | null;
      }>(
        `SELECT id, email, name, goal, weight_kg, height_cm, age FROM users WHERE id = $1`,
        [userId],
      );

      const user = rows[0];
      const { rows: mealDates } = await pool.query<{ created_at: Date }>(
        `SELECT created_at FROM meals WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );

      const streaks = computeStreaks(mealDates.map((m) => m.created_at));

      return toProfile(
        userId,
        userEmail,
        user ?? { email: userEmail, name: null, goal: null, weight_kg: null, height_cm: null, age: null },
        mealDates.length,
        streaks,
      );
    },
  );

  app.patch<{
    Body: {
      goal?: string;
      name?: string;
      weightKg?: number | null;
      heightCm?: number | null;
      age?: number | null;
    };
  }>(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { goal, name, weightKg, heightCm, age } = request.body ?? {};

      await pool.query(
        `INSERT INTO users (id, email)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [userId, userEmail],
      );

      if (goal !== undefined) {
        await pool.query(`UPDATE users SET goal = $1 WHERE id = $2`, [goal, userId]);
      }
      if (name !== undefined) {
        await pool.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);
      }
      if (weightKg !== undefined) {
        await pool.query(`UPDATE users SET weight_kg = $1 WHERE id = $2`, [weightKg, userId]);
      }
      if (heightCm !== undefined) {
        await pool.query(`UPDATE users SET height_cm = $1 WHERE id = $2`, [heightCm, userId]);
      }
      if (age !== undefined) {
        await pool.query(`UPDATE users SET age = $1 WHERE id = $2`, [age, userId]);
      }

      return { ok: true };
    },
  );
}
