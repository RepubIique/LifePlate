import type { PoolClient } from "pg";
import { invalidateDailyInsight } from "./dailyInsightCache.js";
import { mealDateKey, todayDateKey } from "./streaks.js";
import { syncUserMealStats } from "./userMealStats.js";

export async function onMealDataChanged(
  userId: string,
  options?: {
    mealCreatedAt?: Date;
    client?: PoolClient;
  },
): Promise<void> {
  await syncUserMealStats(userId, options?.client);
  const insightDate = options?.mealCreatedAt
    ? mealDateKey(options.mealCreatedAt)
    : todayDateKey();
  await invalidateDailyInsight(userId, insightDate);
}
