import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { computeStreaksFromDayKeys } from "./streaks.js";

async function queryDistinctMealDays(
  userId: string,
  client?: PoolClient,
): Promise<string[]> {
  const runner = client ?? pool;
  const { rows } = await runner.query<{ log_date: Date }>(
    `SELECT DISTINCT created_at::date AS log_date
     FROM meals
     WHERE user_id = $1
     ORDER BY log_date`,
    [userId],
  );
  return rows.map((row) => {
    const d = row.log_date;
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  });
}

export async function syncUserMealStats(
  userId: string,
  client?: PoolClient,
): Promise<void> {
  const runner = client ?? pool;
  const dayKeys = await queryDistinctMealDays(userId, client);
  const streaks = computeStreaksFromDayKeys(dayKeys);
  const mealsLogged = await countMeals(userId, client);

  await runner.query(
    `UPDATE users
     SET meals_logged = $2,
         current_streak = $3,
         longest_streak = $4
     WHERE id = $1`,
    [userId, mealsLogged, streaks.current, streaks.longest],
  );
}

async function countMeals(userId: string, client?: PoolClient): Promise<number> {
  const runner = client ?? pool;
  const { rows } = await runner.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM meals WHERE user_id = $1`,
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

// Recompute streak columns for all users (e.g. after migration backfill).
export async function backfillAllUserMealStats(): Promise<void> {
  const { rows } = await pool.query<{ id: string }>(`SELECT id FROM users`);
  for (const row of rows) {
    await syncUserMealStats(row.id);
  }
}
