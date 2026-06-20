import type { PoolClient } from "pg";
import { MEAL_UTC_DAY_DATE_SQL } from "./mealLogDate.js";

export async function reorderMealsForDay(
  client: PoolClient,
  userId: string,
  _dateKey: string,
  mealIds: string[],
): Promise<void> {
  const { rows } = await client.query<{
    id: string;
    created_at: Date;
    utc_day: string;
  }>(
    `SELECT id, created_at, ${MEAL_UTC_DAY_DATE_SQL} AS utc_day
     FROM meals
     WHERE user_id = $1 AND id = ANY($2::uuid[])`,
    [userId, mealIds],
  );

  if (rows.length !== mealIds.length) {
    throw new ReorderMealsValidationError(
      "mealIds must include every meal for this day exactly once",
    );
  }

  const utcDays = new Set(rows.map((row) => row.utc_day));
  if (utcDays.size !== 1) {
    throw new ReorderMealsValidationError(
      "mealIds must belong to a single calendar day",
    );
  }

  const sortedAts = rows
    .map((row) => row.created_at)
    .sort((a, b) => b.getTime() - a.getTime());

  const loggedAts = mealIds.map((_, index) => sortedAts[index]!);

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
