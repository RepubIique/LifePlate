import type { UserProfile } from "@lifeplate/shared";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type ProfileCachePayload = {
  profile: UserProfile;
  fetchedAt: number;
};

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

function normalizeProfile(
  parsed: UserProfile & { avatarUrl?: string | null },
): UserProfile {
  return {
    ...parsed,
    hasAvatar: parsed.hasAvatar ?? Boolean(parsed.avatarUrl),
  };
}

export async function loadCachedProfile(
  userId: string,
): Promise<ProfileCachePayload | null> {
  const raw = await read(cacheKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProfileCachePayload | (UserProfile & { avatarUrl?: string | null });
    if ("profile" in parsed && parsed.profile) {
      return {
        profile: normalizeProfile(parsed.profile),
        fetchedAt: parsed.fetchedAt,
      };
    }
    const legacy = parsed as UserProfile & { avatarUrl?: string | null };
    if (legacy.id) {
      return { profile: normalizeProfile(legacy), fetchedAt: 0 };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveCachedProfile(
  profile: UserProfile,
  fetchedAt: number,
): Promise<void> {
  const payload: ProfileCachePayload = { profile, fetchedAt };
  await write(cacheKey(profile.id), JSON.stringify(payload));
}

export async function clearCachedProfile(userId: string): Promise<void> {
  await remove(cacheKey(userId));
}
