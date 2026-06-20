import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { MEAL_LOG_DATE_KEY_SQL } from "./mealLogDate.js";
import { computeStreaksFromDayKeys } from "./streaks.js";
import { queryStreakFreezeDays } from "./gamificationStats.js";

async function queryDistinctMealDays(
  userId: string,
  client?: PoolClient,
): Promise<string[]> {
  const runner = client ?? pool;
  const { rows } = await runner.query<{ log_date: string }>(
    `SELECT DISTINCT ${MEAL_LOG_DATE_KEY_SQL} AS log_date
     FROM meals
     WHERE user_id = $1
     ORDER BY log_date`,
    [userId],
  );
  return rows.map((row) => row.log_date);
}

export async function syncUserMealStats(
  userId: string,
  client?: PoolClient,
): Promise<void> {
  const runner = client ?? pool;
  const dayKeys = await queryDistinctMealDays(userId, client);
  const freezeDays = await queryStreakFreezeDays(userId);
  const mergedDayKeys = [...new Set([...dayKeys, ...freezeDays])];
  const streaks = computeStreaksFromDayKeys(mergedDayKeys);
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
