import { todayDateKey } from "@lifeplate/shared";
import { invalidateDailyInsight } from "./dailyInsightCache.js";
import { syncUserMealStats } from "./userMealStats.js";
import type { PoolClient } from "pg";

export async function onMealDataChanged(
  userId: string,
  options?: {
    mealLogDate?: string;
    previousMealLogDate?: string;
    client?: PoolClient;
  },
): Promise<void> {
  await syncUserMealStats(userId, options?.client);

  const insightDates = new Set<string>();
  if (options?.mealLogDate) {
    insightDates.add(options.mealLogDate);
  }
  if (options?.previousMealLogDate) {
    insightDates.add(options.previousMealLogDate);
  }
  if (insightDates.size === 0) {
    insightDates.add(todayDateKey());
  }

  for (const insightDate of insightDates) {
    await invalidateDailyInsight(userId, insightDate);
  }
}
