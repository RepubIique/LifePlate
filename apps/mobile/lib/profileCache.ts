import type { UserProfile } from "@lifeplate/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function cacheKey(userId: string) {
  return `lifeplate:profile:${userId}`;
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

export async function loadCachedProfile(userId: string): Promise<UserProfile | null> {
  const raw = await read(cacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveCachedProfile(profile: UserProfile): Promise<void> {
  await write(cacheKey(profile.id), JSON.stringify(profile));
}

export async function clearCachedProfile(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}
