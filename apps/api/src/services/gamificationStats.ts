import { todayDateKey } from "@lifeplate/shared";
import { pool } from "../db.js";

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
