import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

type HydrationCachePayload = {
  byDate: Record<string, number>;
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:hydration:${userId}`;
}

export async function loadCachedHydration(
  userId: string,
): Promise<HydrationCachePayload | null> {
  return readSecureStoreJson<HydrationCachePayload>(cacheKey(userId));
}

export async function saveCachedHydration(
  userId: string,
  byDate: Record<string, number>,
  fetchedAt: number,
): Promise<void> {
  const payload: HydrationCachePayload = { byDate, fetchedAt };
  await writeSecureStoreJson(cacheKey(userId), payload);
}

export async function clearCachedHydration(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
