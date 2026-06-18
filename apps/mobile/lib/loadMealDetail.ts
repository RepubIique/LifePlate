import type { MealDetail } from "@lifeplate/shared";
import { fetchMeal } from "@/lib/api";
import {
  getCachedMealDetail,
  setCachedMealDetail,
} from "@/lib/mealDetailCache";

type LoadOptions = {
  force?: boolean;
};

export async function loadMealDetail(
  id: string,
  options?: LoadOptions,
): Promise<MealDetail> {
  if (!options?.force) {
    const cached = getCachedMealDetail(id);
    if (cached) return cached;
  }

  const meal = await fetchMeal(id);
  setCachedMealDetail(meal);
  return meal;
}
