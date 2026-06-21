import type { UserProfile } from "@lifeplate/shared";
import {
  readSecureStoreString,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

const PROFILE_CACHE_VERSION = 2;

type ProfileCachePayload = {
  v: number;
  profile: UserProfile;
  fetchedAt: number;
};

export type LoadedProfileCache = Pick<ProfileCachePayload, "profile" | "fetchedAt">;

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
    createdAt: parsed.createdAt ?? new Date(0).toISOString(),
    loggingLocked: parsed.loggingLocked ?? false,
    freeLoggingDaysRemaining: parsed.freeLoggingDaysRemaining ?? 0,
  };
}

function readRawProfile(
  parsed:
    | ProfileCachePayload
    | (UserProfile & { avatarUrl?: string | null; fetchedAt?: number; v?: number }),
): (UserProfile & { avatarUrl?: string | null }) | null {
  if ("profile" in parsed && parsed.profile) {
    return parsed.profile as UserProfile & { avatarUrl?: string | null };
  }
  if ("id" in parsed && parsed.id) {
    return parsed as UserProfile & { avatarUrl?: string | null };
  }
  return null;
}

export function isProfileEntitlementsStale(profile: UserProfile): boolean {
  return (
    !("isPaid" in profile) ||
    !("createdAt" in profile) ||
    !("loggingLocked" in profile)
  );
}

export async function loadCachedProfile(
  userId: string,
): Promise<LoadedProfileCache | null> {
  const raw = await readSecureStoreString(cacheKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as
      | ProfileCachePayload
      | (UserProfile & { avatarUrl?: string | null; fetchedAt?: number; v?: number });
    const fetchedAt =
      "fetchedAt" in parsed && typeof parsed.fetchedAt === "number"
        ? parsed.fetchedAt
        : 0;
    const version =
      "v" in parsed && typeof parsed.v === "number" ? parsed.v : 1;
    const rawProfile = readRawProfile(parsed);
    if (
      !rawProfile ||
      version < PROFILE_CACHE_VERSION ||
      isProfileEntitlementsStale(rawProfile)
    ) {
      return null;
    }
    return {
      profile: normalizeProfile(rawProfile),
      fetchedAt,
    };
  } catch {
    return null;
  }
}

export async function saveCachedProfile(
  profile: UserProfile,
  fetchedAt: number,
): Promise<void> {
  const payload: ProfileCachePayload = {
    v: PROFILE_CACHE_VERSION,
    profile,
    fetchedAt,
  };
  await writeSecureStoreJson(cacheKey(profile.id), payload);
}

export async function clearCachedProfile(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
