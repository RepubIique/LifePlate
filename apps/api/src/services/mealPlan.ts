import {
  inferMealType,
  isValidPlanDateKey,
  loggedAtForDateKey,
  normalizeMealNotes,
  todayDateKey,
  type MealPlanRequest,
  type MealType,
} from "@lifeplate/shared";
import { pool } from "../db.js";
import { onMealDataChanged } from "./mealSideEffects.js";

export class MealPlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MealPlanValidationError";
  }
}

function normalizeMealName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new MealPlanValidationError("mealName is required");
  }
  if (trimmed.length > 200) {
    throw new MealPlanValidationError("mealName must be 200 characters or fewer");
  }
  return trimmed;
}

export async function createPlannedMeal(
  userId: string,
  body: MealPlanRequest,
): Promise<{ id: string }> {
  const mealName = normalizeMealName(body.mealName ?? "");
  const logDate = body.logDate?.trim() ?? "";

  if (!isValidPlanDateKey(logDate)) {
    throw new MealPlanValidationError("Invalid logDate — must be within the next 14 days");
  }

  const mealType: MealType = body.mealType ?? inferMealType();
  const notes = normalizeMealNotes(body.notes);
  const createdAt = loggedAtForDateKey(logDate, mealType);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE meals SET sort_index = sort_index + 1
       WHERE user_id = $1 AND log_date = $2::date AND status = 'planned'`,
      [userId, logDate],
    );
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO meals (
         user_id, meal_type, meal_name, image_url, created_at, log_date, sort_index,
         calories, protein, carbs, fat, fibre, sugar, sodium, confidence, foods, notes, status
       )
       VALUES ($1, $2, $3, '', $4, $5::date, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', $6, 'planned')
       RETURNING id`,
      [userId, mealType, mealName, createdAt, logDate, notes],
    );
    await client.query("COMMIT");
    return { id: rows[0]!.id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function confirmPlannedMeal(
  userId: string,
  mealId: string,
  loggedAt?: string,
): Promise<{ id: string }> {
  const { rows } = await pool.query<{
    id: string;
    log_date: string;
    meal_type: string | null;
    status: string;
  }>(
    `SELECT id, log_date::text AS log_date, meal_type, status
     FROM meals
     WHERE id = $1 AND user_id = $2`,
    [mealId, userId],
  );
  const meal = rows[0];
  if (!meal) {
    throw new MealPlanValidationError("Not found");
  }
  if (meal.status !== "planned") {
    throw new MealPlanValidationError("Meal is not planned");
  }

  const today = todayDateKey();
  if (meal.log_date > today) {
    throw new MealPlanValidationError("Cannot confirm a future planned meal yet");
  }

  const eatenAt = loggedAt ? new Date(loggedAt) : new Date();
  if (Number.isNaN(eatenAt.getTime())) {
    throw new MealPlanValidationError("Invalid loggedAt");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE meals SET sort_index = sort_index + 1
       WHERE user_id = $1 AND log_date = $2::date AND id != $3 AND status = 'logged'`,
      [userId, meal.log_date, mealId],
    );
    await client.query(
      `UPDATE meals
       SET status = 'logged',
           created_at = $1,
           sort_index = 0,
           foods = CASE WHEN foods = '{}' THEN ARRAY[meal_name] ELSE foods END
       WHERE id = $2 AND user_id = $3`,
      [eatenAt, mealId, userId],
    );
    await client.query("COMMIT");
    await onMealDataChanged(userId, { mealLogDate: meal.log_date });
    return { id: mealId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updatePlannedMeal(
  userId: string,
  mealId: string,
  patch: {
    mealName?: string;
    mealType?: MealType | null;
    logDate?: string;
    notes?: string | null;
  },
): Promise<void> {
  const { rows } = await pool.query<{
    status: string;
    log_date: string;
    meal_type: string | null;
  }>(
    `SELECT status, log_date::text AS log_date, meal_type
     FROM meals WHERE id = $1 AND user_id = $2`,
    [mealId, userId],
  );
  const meal = rows[0];
  if (!meal) {
    throw new MealPlanValidationError("Not found");
  }
  if (meal.status !== "planned") {
    throw new MealPlanValidationError("Only planned meals can be edited here");
  }

  let nextLogDate = meal.log_date;
  if (patch.logDate !== undefined) {
    if (!isValidPlanDateKey(patch.logDate)) {
      throw new MealPlanValidationError("Invalid logDate");
    }
    nextLogDate = patch.logDate;
  }

  const mealName = patch.mealName !== undefined ? normalizeMealName(patch.mealName) : undefined;
  const mealType = patch.mealType ?? undefined;
  const notes =
    patch.notes !== undefined ? normalizeMealNotes(patch.notes) : undefined;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (nextLogDate !== meal.log_date) {
      await client.query(
        `UPDATE meals SET sort_index = sort_index + 1
         WHERE user_id = $1 AND log_date = $2::date AND status = 'planned' AND id != $3`,
        [userId, nextLogDate, mealId],
      );
      const createdAt = loggedAtForDateKey(
        nextLogDate,
        mealType ?? meal.meal_type,
      );
      await client.query(
        `UPDATE meals
         SET log_date = $1::date,
             created_at = $2,
             sort_index = 0
         WHERE id = $3 AND user_id = $4`,
        [nextLogDate, createdAt, mealId, userId],
      );
    }

    if (mealName !== undefined || mealType !== undefined || patch.notes !== undefined) {
      await client.query(
        `UPDATE meals
         SET meal_name = COALESCE($1, meal_name),
             meal_type = COALESCE($2, meal_type),
             notes = CASE WHEN $4 THEN $3 ELSE notes END
         WHERE id = $5 AND user_id = $6`,
        [
          mealName ?? null,
          mealType ?? null,
          notes ?? null,
          patch.notes !== undefined,
          mealId,
          userId,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
