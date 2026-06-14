import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type HydrationCachePayload = {
  byDate: Record<string, number>;
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:hydration:${userId}`;
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

export async function loadCachedHydration(
  userId: string,
): Promise<HydrationCachePayload | null> {
  const raw = await read(cacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HydrationCachePayload;
  } catch {
    return null;
  }
}

export async function saveCachedHydration(
  userId: string,
  byDate: Record<string, number>,
  fetchedAt: number,
): Promise<void> {
  const payload: HydrationCachePayload = { byDate, fetchedAt };
  await write(cacheKey(userId), JSON.stringify(payload));
}

export async function clearCachedHydration(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}
