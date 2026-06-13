import type { NutritionDashboardResponse } from "@lifeplate/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type DashboardCachePayload = {
  dashboard: NutritionDashboardResponse;
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:dashboard:${userId}`;
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

export async function loadCachedDashboard(
  userId: string,
): Promise<DashboardCachePayload | null> {
  const raw = await read(cacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DashboardCachePayload;
  } catch {
    return null;
  }
}

export async function saveCachedDashboard(
  userId: string,
  dashboard: NutritionDashboardResponse,
  fetchedAt: number,
): Promise<void> {
  const payload: DashboardCachePayload = { dashboard, fetchedAt };
  await write(cacheKey(userId), JSON.stringify(payload));
}

export async function clearCachedDashboard(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}
