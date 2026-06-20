import type { GamificationBundleResponse } from "@lifeplate/shared";
import { pool } from "../db.js";
import { listCoopChallenges } from "./coopChallenges.js";

export async function getSharesSentCount(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM meal_share_requests
     WHERE from_user_id = $1 AND status = 'accepted'`,
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getGamificationBundle(
  userId: string,
  hydrationTarget: number,
): Promise<GamificationBundleResponse> {
  const [sharesSentCount, challenges] = await Promise.all([
    getSharesSentCount(userId),
    listCoopChallenges(userId, hydrationTarget),
  ]);
  return {
    stats: { sharesSentCount },
    challenges,
  };
}
