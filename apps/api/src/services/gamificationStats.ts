import { todayDateKey } from "@lifeplate/shared";
import { pool } from "../db.js";
import { MEAL_LOG_DATE_KEY_SQL } from "./mealLogDate.js";
import { fetchHydrationHistory } from "./nutritionDashboard.js";

export async function getGamificationStats(userId: string, hydrationTarget: number) {
  const [shareRows, breakfastRows, notesRows, hydrationHistory] = await Promise.all([
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM meal_share_requests
       WHERE from_user_id = $1 AND status = 'accepted'`,
      [userId],
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(DISTINCT ${MEAL_LOG_DATE_KEY_SQL})::text AS count
       FROM meals
       WHERE user_id = $1 AND meal_type = 'breakfast'`,
      [userId],
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM meals
       WHERE user_id = $1 AND notes IS NOT NULL AND TRIM(notes) <> ''`,
      [userId],
    ),
    fetchHydrationHistory(userId, 7),
  ]);

  const hydrationGoalDaysLast7 = hydrationHistory.filter(
    (row) => row.glasses >= hydrationTarget,
  ).length;

  return {
    sharesSentCount: Number(shareRows.rows[0]?.count ?? 0),
    breakfastLogDays: Number(breakfastRows.rows[0]?.count ?? 0),
    mealsWithNotesCount: Number(notesRows.rows[0]?.count ?? 0),
    hydrationGoalDaysLast7,
  };
}

export async function queryStreakFreezeDays(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ log_date: string }>(
    `SELECT log_date::text AS log_date FROM user_streak_freezes WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.log_date);
}

export async function streakFreezeUsedThisMonth(userId: string): Promise<boolean> {
  const monthPrefix = todayDateKey().slice(0, 7);
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM user_streak_freezes
     WHERE user_id = $1 AND to_char(log_date, 'YYYY-MM') = $2`,
    [userId, monthPrefix],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}
