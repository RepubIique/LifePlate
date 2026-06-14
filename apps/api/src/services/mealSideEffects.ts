import { invalidateDailyInsight } from "./dailyInsightCache.js";
import { mealDateKey, todayDateKey } from "./streaks.js";
import { syncUserMealStats } from "./userMealStats.js";
import type { PoolClient } from "pg";

export async function onMealDataChanged(
  userId: string,
  options?: {
    mealCreatedAt?: Date;
    previousMealCreatedAt?: Date;
    client?: PoolClient;
  },
): Promise<void> {
  await syncUserMealStats(userId, options?.client);

  const insightDates = new Set<string>();
  if (options?.mealCreatedAt) {
    insightDates.add(mealDateKey(options.mealCreatedAt));
  }
  if (options?.previousMealCreatedAt) {
    insightDates.add(mealDateKey(options.previousMealCreatedAt));
  }
  if (insightDates.size === 0) {
    insightDates.add(todayDateKey());
  }

  for (const insightDate of insightDates) {
    await invalidateDailyInsight(userId, insightDate);
  }
}
