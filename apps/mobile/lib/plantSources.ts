import { dateKeyFromIso, plantLabelsForFood, todayDateKey, type MealListItem } from "@lifeplate/shared";

export type PlantSourceEntry = {
  key: string;
  mealId: string;
  foodIndex: number;
  food: string;
};

export function buildPlantSources(meals: MealListItem[]): PlantSourceEntry[] {
  const entries: PlantSourceEntry[] = [];

  for (const meal of meals) {
    for (const [foodIndex, food] of (meal.foods ?? []).entries()) {
      const trimmed = food.trim();
      if (!trimmed || plantLabelsForFood(trimmed).length === 0) continue;
      entries.push({
        key: `${meal.id}:${foodIndex}`,
        mealId: meal.id,
        foodIndex,
        food: trimmed,
      });
    }
  }

  return entries;
}

export function filterTodayMeals(meals: MealListItem[], dateKey = todayDateKey()): MealListItem[] {
  return meals.filter((meal) => dateKeyFromIso(meal.createdAt) === dateKey);
}

export function normalizeFoodName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
