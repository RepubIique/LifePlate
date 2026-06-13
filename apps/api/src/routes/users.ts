import type { FastifyInstance } from "fastify";
import {
  computeNutritionTargets,
  type Gender,
  type ProfilePatchResponse,
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
  meals_logged: number;
  current_streak: number;
  longest_streak: number;
};

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
    mealsLogged: row.meals_logged,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
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
    `SELECT email, name, goal, weight_kg, height_cm, age, gender,
            meals_logged, current_streak, longest_streak
     FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function buildProfile(userId: string, userEmail: string): Promise<UserProfile> {
  const row = await loadUserRow(userId);

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
      meals_logged: 0,
      current_streak: 0,
      longest_streak: 0,
    },
  );
}

const TARGET_AFFECTING_FIELDS = new Set([
  "goal",
  "weightKg",
  "heightCm",
  "age",
  "gender",
]);

async function buildProfilePatchResponse(
  userId: string,
  userEmail: string,
  body: {
    goal?: string;
    name?: string;
    weightKg?: number | null;
    heightCm?: number | null;
    age?: number | null;
    gender?: Gender | null;
  },
): Promise<ProfilePatchResponse> {
  const patch: ProfilePatchResponse = {};

  if (body.goal !== undefined) patch.goal = body.goal;
  if (body.name !== undefined) patch.name = body.name;
  if (body.weightKg !== undefined) patch.weightKg = body.weightKg;
  if (body.heightCm !== undefined) patch.heightCm = body.heightCm;
  if (body.age !== undefined) patch.age = body.age;
  if (body.gender !== undefined) patch.gender = body.gender;

  const needsTargets = Object.keys(body).some((key) =>
    TARGET_AFFECTING_FIELDS.has(key),
  );
  if (needsTargets) {
    const row = await loadUserRow(userId);
    const weightKg =
      body.weightKg !== undefined
        ? body.weightKg
        : row?.weight_kg != null
          ? Number(row.weight_kg)
          : null;
    const heightCm =
      body.heightCm !== undefined
        ? body.heightCm
        : row?.height_cm != null
          ? Number(row.height_cm)
          : null;
    const age = body.age !== undefined ? body.age : (row?.age ?? null);
    const gender =
      body.gender !== undefined ? body.gender : parseGender(row?.gender ?? null);
    const goal = body.goal !== undefined ? body.goal : (row?.goal ?? null);

    patch.nutritionTargets = computeNutritionTargets(
      { weightKg, heightCm, age, gender },
      goal,
    );
  }

  return patch;
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

      return buildProfilePatchResponse(userId, userEmail, request.body ?? {});
    },
  );
}
