import { createdAtForDayPosition } from "@lifeplate/shared";
import type { PoolClient } from "pg";
import { MEAL_UTC_DAY_SQL } from "./mealLogDate.js";

export async function reorderMealsForDay(
  client: PoolClient,
  userId: string,
  dateKey: string,
  mealIds: string[],
): Promise<void> {
  const { rows: dayRows } = await client.query<{ id: string }>(
    `SELECT id FROM meals WHERE user_id = $1 AND ${MEAL_UTC_DAY_SQL} = $2`,
    [userId, dateKey],
  );
  const dayIds = dayRows.map((row) => row.id).sort();
  const requestedIds = [...mealIds].sort();

  if (
    dayIds.length !== requestedIds.length ||
    !dayIds.every((id, index) => id === requestedIds[index])
  ) {
    throw new ReorderMealsValidationError(
      "mealIds must include every meal for this day exactly once",
    );
  }

  const loggedAts = mealIds.map((_, index) =>
    new Date(createdAtForDayPosition(dateKey, index, mealIds.length)),
  );

  await client.query(
    `UPDATE meals AS m
     SET created_at = v.logged_at
     FROM (
       SELECT unnest($1::uuid[]) AS id, unnest($2::timestamptz[]) AS logged_at
     ) AS v
     WHERE m.id = v.id AND m.user_id = $3`,
    [mealIds, loggedAts, userId],
  );
}

export class ReorderMealsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReorderMealsValidationError";
  }
}
