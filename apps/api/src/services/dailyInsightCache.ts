import { pool } from "../db.js";
import { todayDateKey } from "./streaks.js";

export async function getCachedDailyInsight(
  userId: string,
  insightDate: string = todayDateKey(),
): Promise<string | null> {
  const { rows } = await pool.query<{ lifeplate_insight: string }>(
    `SELECT lifeplate_insight FROM daily_insights
     WHERE user_id = $1 AND insight_date = $2`,
    [userId, insightDate],
  );
  return rows[0]?.lifeplate_insight ?? null;
}

export async function saveDailyInsight(
  userId: string,
  insight: string,
  insightDate: string = todayDateKey(),
): Promise<void> {
  await pool.query(
    `INSERT INTO daily_insights (user_id, insight_date, lifeplate_insight)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, insight_date)
     DO UPDATE SET
       lifeplate_insight = EXCLUDED.lifeplate_insight,
       generated_at = NOW()`,
    [userId, insightDate, insight],
  );
}

export async function invalidateDailyInsight(
  userId: string,
  insightDate: string = todayDateKey(),
): Promise<void> {
  await pool.query(
    `DELETE FROM daily_insights WHERE user_id = $1 AND insight_date = $2`,
    [userId, insightDate],
  );
}
