import type { PoolClient } from "pg";

export async function reorderMealsForDay(
  client: PoolClient,
  userId: string,
  _dateKey: string,
  mealIds: string[],
): Promise<void> {
  const { rows } = await client.query<{
    id: string;
    created_at: Date;
  }>(
    `SELECT id, created_at
     FROM meals
     WHERE user_id = $1 AND id = ANY($2::uuid[])`,
    [userId, mealIds],
  );

  if (rows.length !== mealIds.length) {
    throw new ReorderMealsValidationError(
      "One or more mealIds were not found",
    );
  }

  const rowIds = new Set(rows.map((row) => row.id));
  if (!mealIds.every((id) => rowIds.has(id))) {
    throw new ReorderMealsValidationError(
      "One or more mealIds were not found",
    );
  }

  // Permute existing timestamps only — client groups by local calendar day, which
  // may span two UTC dates; do not require a single UTC day here.
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
