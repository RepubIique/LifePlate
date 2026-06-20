import type { FriendSummary, MealShareRequestSummary } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

export type FriendsCachePayload = {
  friendCode: string;
  friends: FriendSummary[];
  pendingShares: MealShareRequestSummary[];
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:friends:${userId}`;
}

export async function loadCachedFriends(userId: string): Promise<FriendsCachePayload | null> {
  return readSecureStoreJson<FriendsCachePayload>(cacheKey(userId));
}

export async function saveCachedFriends(
  userId: string,
  payload: Omit<FriendsCachePayload, "fetchedAt">,
  fetchedAt: number,
): Promise<void> {
  await writeSecureStoreJson(cacheKey(userId), { ...payload, fetchedAt });
}

export async function clearCachedFriends(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
