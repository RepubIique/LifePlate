import type { MealDetail } from "@lifeplate/shared";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";

type CacheEntry = {
  meal: MealDetail;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();

export function getCachedMealDetail(id: string): MealDetail | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TAB_FOCUS_STALE_MS) {
    cache.delete(id);
    return null;
  }
  return entry.meal;
}

export function setCachedMealDetail(meal: MealDetail): void {
  cache.set(meal.id, { meal, fetchedAt: Date.now() });
}

export function patchCachedMealDetail(id: string, patch: Partial<MealDetail>): void {
  const entry = cache.get(id);
  if (!entry) return;
  const meal = { ...entry.meal, ...patch };
  cache.set(id, { meal, fetchedAt: Date.now() });
}

export function invalidateMealDetail(id: string): void {
  cache.delete(id);
}

export function invalidateAllMealDetails(): void {
  cache.clear();
}
