import type { CoopChallengeSummary, GamificationServerStatsResponse } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

export type GamificationCachePayload = {
  stats: GamificationServerStatsResponse;
  challenges: CoopChallengeSummary[];
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:gamification:${userId}`;
}

export async function loadCachedGamification(
  userId: string,
): Promise<GamificationCachePayload | null> {
  return readSecureStoreJson<GamificationCachePayload>(cacheKey(userId));
}

export async function saveCachedGamification(
  userId: string,
  payload: Omit<GamificationCachePayload, "fetchedAt">,
  fetchedAt: number,
): Promise<void> {
  await writeSecureStoreJson(cacheKey(userId), { ...payload, fetchedAt });
}

export async function clearCachedGamification(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
