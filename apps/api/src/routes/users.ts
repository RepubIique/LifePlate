import type { FastifyInstance } from "fastify";
import {
  computeNutritionTargets,
  type Gender,
  type UserProfile,
} from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";

type UserRow = {
  email: string;
  name: string | null;
  goal: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  age: number | null;
  gender: string | null;
};

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

function parseGender(value: string | null): Gender | null {
  if (value === "female" || value === "male" || value === "unspecified") {
    return value;
  }
  return null;
}

function toProfile(
  userId: string,
  userEmail: string,
  row: UserRow,
  mealsLogged: number,
  streaks: { current: number; longest: number },
): UserProfile {
  const weightKg = row.weight_kg != null ? Number(row.weight_kg) : null;
  const heightCm = row.height_cm != null ? Number(row.height_cm) : null;
  const age = row.age;
  const gender = parseGender(row.gender);

  return {
    id: userId,
    email: row.email ?? userEmail,
    name: row.name,
    goal: row.goal,
    weightKg,
    heightCm,
    age,
    gender,
    nutritionTargets: computeNutritionTargets(
      { weightKg, heightCm, age, gender },
      row.goal,
    ),
    mealsLogged,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}

async function ensureUser(userId: string, userEmail: string) {
  await pool.query(
    `INSERT INTO users (id, email)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [userId, userEmail],
  );
}

async function loadUserRow(userId: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT email, name, goal, weight_kg, height_cm, age, gender
     FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function buildProfile(userId: string, userEmail: string): Promise<UserProfile> {
  const row = await loadUserRow(userId);
  const { rows: mealDates } = await pool.query<{ created_at: Date }>(
    `SELECT created_at FROM meals WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  const streaks = computeStreaks(mealDates.map((m) => m.created_at));

  return toProfile(
    userId,
    userEmail,
    row ?? {
      email: userEmail,
      name: null,
      goal: null,
      weight_kg: null,
      height_cm: null,
      age: null,
      gender: null,
    },
    mealDates.length,
    streaks,
  );
}

export async function userRoutes(app: FastifyInstance) {
  app.get(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request) => {
      const { userId, userEmail } = request as AuthedRequest;
      return buildProfile(userId, userEmail);
    },
  );

  app.patch<{
    Body: {
      goal?: string;
      name?: string;
      weightKg?: number | null;
      heightCm?: number | null;
      age?: number | null;
      gender?: Gender | null;
    };
  }>(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { goal, name, weightKg, heightCm, age, gender } = request.body ?? {};

      await ensureUser(userId, userEmail);

      const sets: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (goal !== undefined) {
        sets.push(`goal = $${idx++}`);
        values.push(goal);
      }
      if (name !== undefined) {
        sets.push(`name = $${idx++}`);
        values.push(name);
      }
      if (weightKg !== undefined) {
        sets.push(`weight_kg = $${idx++}`);
        values.push(weightKg);
      }
      if (heightCm !== undefined) {
        sets.push(`height_cm = $${idx++}`);
        values.push(heightCm);
      }
      if (age !== undefined) {
        sets.push(`age = $${idx++}`);
        values.push(age);
      }
      if (gender !== undefined) {
        sets.push(`gender = $${idx++}`);
        values.push(gender);
      }

      if (sets.length > 0) {
        values.push(userId);
        const { rowCount } = await pool.query(
          `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx}`,
          values,
        );
        if (!rowCount) {
          request.log.error({ userId }, "Profile update matched no rows");
          return reply.code(500).send({ error: "Failed to save profile" });
        }
      }

      return buildProfile(userId, userEmail);
    },
  );
}
