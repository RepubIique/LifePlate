import type { MealListSummary } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

type MealsCachePayload = {
  meals: MealListSummary[];
  fetchedAt: number;
};

function cacheKey(userId: string) {
  return `lifeplate:meals:${userId}`;
}

export async function loadCachedMeals(userId: string): Promise<MealsCachePayload | null> {
  return readSecureStoreJson<MealsCachePayload>(cacheKey(userId));
}

export async function saveCachedMeals(
  userId: string,
  meals: MealListSummary[],
  fetchedAt: number,
): Promise<void> {
  const payload: MealsCachePayload = { meals, fetchedAt };
  await writeSecureStoreJson(cacheKey(userId), payload);
}

export async function clearCachedMeals(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
