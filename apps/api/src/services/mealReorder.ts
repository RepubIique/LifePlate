import type { PoolClient } from "pg";

export async function reorderMealsForDay(
  client: PoolClient,
  userId: string,
  dateKey: string,
  mealIds: string[],
): Promise<void> {
  const { rows } = await client.query<{
    id: string;
    log_date: string;
  }>(
    `SELECT id, log_date::text AS log_date
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

  if (!rows.every((row) => row.log_date === dateKey)) {
    throw new ReorderMealsValidationError(
      "Meals must share the same log date",
    );
  }

  const sortIndices = mealIds.map((_, index) => index);

  await client.query(
    `UPDATE meals AS m
     SET sort_index = v.sort_index
     FROM (
       SELECT unnest($1::uuid[]) AS id, unnest($2::smallint[]) AS sort_index
     ) AS v
     WHERE m.id = v.id AND m.user_id = $3`,
    [mealIds, sortIndices, userId],
  );
}

export class ReorderMealsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReorderMealsValidationError";
  }
}
