import { pool } from "../db.js";

export async function queryStreakFreezeDays(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ log_date: string }>(
    `SELECT log_date::text AS log_date FROM user_streak_freezes WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.log_date);
}
