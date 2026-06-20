import type { NutritionDashboardApiResponse } from "@lifeplate/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

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

async function read(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Non-critical — ignore storage failures.
  }
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
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
  const raw = await read(cacheKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as DayDashboardCachePayload;
    return parsed.byDate ?? {};
  } catch {
    return {};
  }
}

export async function saveCachedDayDashboard(
  userId: string,
  dateKey: string,
  entry: DayDashboardCacheEntry,
): Promise<void> {
  const existing = await loadCachedDayDashboards(userId);
  const byDate = trimEntries({ ...existing, [dateKey]: entry });
  const payload: DayDashboardCachePayload = { byDate };
  await write(cacheKey(userId), JSON.stringify(payload));
}

export async function removeCachedDayDashboard(
  userId: string,
  dateKey: string,
): Promise<void> {
  const existing = await loadCachedDayDashboards(userId);
  if (!(dateKey in existing)) return;
  const { [dateKey]: _removed, ...rest } = existing;
  await write(cacheKey(userId), JSON.stringify({ byDate: rest }));
}

export async function clearCachedDayDashboards(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}
