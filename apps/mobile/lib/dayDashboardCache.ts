import type { NutritionDashboardApiResponse } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

const MAX_CACHED_DAYS = 30;

export type DayDashboardCacheEntry = {
  dashboard: NutritionDashboardApiResponse;
  mealsRevision: string;
  fetchedAt: number;
};

type DayDashboardCachePayload = {
  byDate: Record<string, DayDashboardCacheEntry>;
};

function cacheKey(userId: string) {
  return `lifeplate:day-dashboards:${userId}`;
}

function trimEntries(byDate: Record<string, DayDashboardCacheEntry>) {
  const entries = Object.entries(byDate);
  if (entries.length <= MAX_CACHED_DAYS) return byDate;

  entries.sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);
  const next: Record<string, DayDashboardCacheEntry> = {};
  for (const [dateKey, entry] of entries.slice(0, MAX_CACHED_DAYS)) {
    next[dateKey] = entry;
  }
  return next;
}

export async function loadCachedDayDashboards(
  userId: string,
): Promise<Record<string, DayDashboardCacheEntry>> {
  const parsed = await readSecureStoreJson<DayDashboardCachePayload>(cacheKey(userId));
  return parsed?.byDate ?? {};
}

export async function saveCachedDayDashboard(
  userId: string,
  dateKey: string,
  entry: DayDashboardCacheEntry,
): Promise<void> {
  const existing = await loadCachedDayDashboards(userId);
  const byDate = trimEntries({ ...existing, [dateKey]: entry });
  const payload: DayDashboardCachePayload = { byDate };
  await writeSecureStoreJson(cacheKey(userId), payload);
}

export async function removeCachedDayDashboard(
  userId: string,
  dateKey: string,
): Promise<void> {
  const existing = await loadCachedDayDashboards(userId);
  if (!(dateKey in existing)) return;
  const { [dateKey]: _removed, ...rest } = existing;
  await writeSecureStoreJson(cacheKey(userId), { byDate: rest });
}

export async function clearCachedDayDashboards(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
