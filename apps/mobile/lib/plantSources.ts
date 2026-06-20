import {
  formatPlantAmount,
  formatPlantFoodText,
  mealLogDateKey,
  parsePlantFoodText,
  plantLabelsForFood,
  PLANT_AMOUNT_PRESETS,
  PLANT_UNIT_OPTIONS,
  todayDateKey,
  type MealListItem,
  type PlantUnit,
} from "@lifeplate/shared";

export type PlantSourceEntry = {
  key: string;
  mealId: string;
  foodIndex: number;
  food: string;
  amount: number;
  unit: PlantUnit | null;
  name: string;
};

export function buildPlantSources(meals: MealListItem[]): PlantSourceEntry[] {
  const entries: PlantSourceEntry[] = [];

  for (const meal of meals) {
    for (const [foodIndex, food] of (meal.foods ?? []).entries()) {
      const trimmed = food.trim();
      if (!trimmed || plantLabelsForFood(trimmed).length === 0) continue;
      const parsed = parsePlantFoodText(trimmed);
      entries.push({
        key: `${meal.id}:${foodIndex}`,
        mealId: meal.id,
        foodIndex,
        food: trimmed,
        amount: parsed.amount,
        unit: parsed.unit,
        name: parsed.name,
      });
    }
  }

  return entries;
}

export function filterTodayMeals(meals: MealListItem[], dateKey = todayDateKey()): MealListItem[] {
  return meals.filter((meal) => mealLogDateKey(meal) === dateKey);
}

export function normalizeFoodName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function composePlantFood(
  name: string,
  amount: number,
  unit: PlantUnit | null,
): string {
  return formatPlantFoodText(normalizeFoodName(name), amount, unit);
}

export type { PlantUnit } from "@lifeplate/shared";
export {
  formatPlantAmount,
  parsePlantFoodText,
  PLANT_AMOUNT_PRESETS,
  PLANT_UNIT_OPTIONS,
};
