import type { UserProfile } from "@lifeplate/shared";
import {
  readSecureStoreString,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

type ProfileCachePayload = {
  profile: UserProfile;
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:profile:${userId}`;
}

function normalizeProfile(
  parsed: UserProfile & { avatarUrl?: string | null },
): UserProfile {
  return {
    ...parsed,
    hasAvatar: parsed.hasAvatar ?? Boolean(parsed.avatarUrl),
    isPaid: parsed.isPaid ?? false,
    cloudImageBackup: parsed.cloudImageBackup ?? false,
  };
}

export function isProfileEntitlementsStale(profile: UserProfile): boolean {
  return !("isPaid" in profile) || !("cloudImageBackup" in profile);
}

export async function loadCachedProfile(
  userId: string,
): Promise<ProfileCachePayload | null> {
  const raw = await readSecureStoreString(cacheKey(userId));
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
  await writeSecureStoreJson(cacheKey(profile.id), payload);
}

export async function clearCachedProfile(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
