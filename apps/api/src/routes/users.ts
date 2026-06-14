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
import { validateUploadImage } from "../services/imageValidation.js";
import { MealGuardrailError } from "../services/mealGuardrails.js";
import { resolveStorageObjectUrl, uploadProfileAvatar } from "../services/storage.js";

type UserRow = {
  email: string;
  name: string | null;
  goal: string | null;
  avatar_url: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  age: number | null;
  gender: string | null;
  meals_logged: number;
  current_streak: number;
  longest_streak: number;
  is_paid: boolean;
  cloud_image_backup: boolean;
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
    hasAvatar: Boolean(row.avatar_url?.trim()),
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
    isPaid: row.is_paid,
    cloudImageBackup: row.cloud_image_backup,
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
    `SELECT email, name, goal, avatar_url, weight_kg, height_cm, age, gender,
            meals_logged, current_streak, longest_streak, is_paid, cloud_image_backup
     FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function buildProfile(userId: string, userEmail: string): Promise<UserProfile> {
  const row = await loadUserRow(userId);

  const profile = toProfile(
    userId,
    userEmail,
    row ?? {
      email: userEmail,
      name: null,
      goal: null,
      avatar_url: null,
      weight_kg: null,
      height_cm: null,
      age: null,
      gender: null,
      meals_logged: 0,
      current_streak: 0,
      longest_streak: 0,
      is_paid: false,
      cloud_image_backup: false,
    },
  );

  return profile;
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
    cloudImageBackup?: boolean;
  },
): Promise<ProfilePatchResponse> {
  const patch: ProfilePatchResponse = {};

  if (body.goal !== undefined) patch.goal = body.goal;
  if (body.name !== undefined) patch.name = body.name;
  if (body.weightKg !== undefined) patch.weightKg = body.weightKg;
  if (body.heightCm !== undefined) patch.heightCm = body.heightCm;
  if (body.age !== undefined) patch.age = body.age;
  if (body.gender !== undefined) patch.gender = body.gender;
  if (body.cloudImageBackup !== undefined) {
    patch.cloudImageBackup = body.cloudImageBackup;
  }

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

  app.get(
    "/api/users/me/avatar",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;
      const row = await loadUserRow(userId);
      const avatarUrl = await resolveStorageObjectUrl(row?.avatar_url ?? null);
      return { avatarUrl };
    },
  );

  app.post(
    "/api/users/me/avatar",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No image provided" });
      }

      const buffer = await file.toBuffer();
      const mimeType = file.mimetype || "image/jpeg";

      try {
        validateUploadImage(buffer, mimeType);
      } catch (err) {
        if (err instanceof MealGuardrailError) {
          return reply.code(err.status).send({
            error: err.message,
            code: err.code,
            message: err.message,
          });
        }
        throw err;
      }

      await ensureUser(userId, userEmail);

      const existing = await loadUserRow(userId);

      let avatarPath: string;
      try {
        avatarPath = await uploadProfileAvatar(
          userId,
          buffer,
          mimeType,
          existing?.avatar_url ?? null,
        );
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: "Failed to upload profile photo" });
      }

      const { rowCount } = await pool.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2`,
        [avatarPath, userId],
      );
      if (!rowCount) {
        return reply.code(500).send({ error: "Failed to save profile photo" });
      }

      const avatarUrl = await resolveStorageObjectUrl(avatarPath);
      return { avatarUrl };
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
      cloudImageBackup?: boolean;
    };
  }>(
    "/api/users/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const { goal, name, weightKg, heightCm, age, gender, cloudImageBackup } =
        request.body ?? {};

      await ensureUser(userId, userEmail);

      if (cloudImageBackup === true) {
        const row = await loadUserRow(userId);
        if (!row?.is_paid) {
          return reply.code(403).send({
            error: "Cloud photo backup requires LifePlate Plus.",
            code: "PLUS_REQUIRED",
          });
        }
      }

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
      if (cloudImageBackup !== undefined) {
        sets.push(`cloud_image_backup = $${idx++}`);
        values.push(cloudImageBackup);
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
