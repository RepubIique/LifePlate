import type { NutritionDashboardApiResponse } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

type DashboardCachePayload = {
  dashboard: NutritionDashboardApiResponse;
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:dashboard:${userId}`;
}

export async function loadCachedDashboard(
  userId: string,
): Promise<DashboardCachePayload | null> {
  const parsed = await readSecureStoreJson<DashboardCachePayload>(cacheKey(userId));
  if (!parsed?.dashboard?.today) return null;
  return parsed;
}

export async function saveCachedDashboard(
  userId: string,
  dashboard: NutritionDashboardApiResponse,
  fetchedAt: number,
): Promise<void> {
  const payload: DashboardCachePayload = { dashboard, fetchedAt };
  await writeSecureStoreJson(cacheKey(userId), payload);
}

export async function clearCachedDashboard(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}

export { todayDateKey } from "@lifeplate/shared";
