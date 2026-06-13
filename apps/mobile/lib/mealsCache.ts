import type { MealListSummary } from "@lifeplate/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type MealsCachePayload = {
  meals: MealListSummary[];
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:meals:${userId}`;
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

export async function loadCachedMeals(userId: string): Promise<MealsCachePayload | null> {
  const raw = await read(cacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MealsCachePayload;
  } catch {
    return null;
  }
}

export async function saveCachedMeals(
  userId: string,
  meals: MealListSummary[],
  fetchedAt: number,
): Promise<void> {
  const payload: MealsCachePayload = { meals, fetchedAt };
  await write(cacheKey(userId), JSON.stringify(payload));
}

export async function clearCachedMeals(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}
