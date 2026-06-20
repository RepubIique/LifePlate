import type { InsightsResponse } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";
import { currentWeekStartKey } from "@/lib/weekInsightsWindow";

export type WeekInsightsCachePayload = {
  insights: InsightsResponse;
  weekStartDateKey: string;
  fetchedAt: number;
};

export { currentWeekStartKey } from "@/lib/weekInsightsWindow";

function cacheKey(userId: string) {
  return `lifeplate:week-insights:${userId}`;
}

export async function loadCachedWeekInsights(
  userId: string,
): Promise<WeekInsightsCachePayload | null> {
  const parsed = await readSecureStoreJson<WeekInsightsCachePayload>(cacheKey(userId));
  if (!parsed?.insights) return null;
  if (parsed.weekStartDateKey !== currentWeekStartKey()) return null;
  return parsed;
}

export async function saveCachedWeekInsights(
  userId: string,
  insights: InsightsResponse,
  fetchedAt: number,
): Promise<void> {
  const payload: WeekInsightsCachePayload = {
    insights,
    weekStartDateKey: currentWeekStartKey(),
    fetchedAt,
  };
  await writeSecureStoreJson(cacheKey(userId), payload);
}

export async function clearCachedWeekInsights(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
