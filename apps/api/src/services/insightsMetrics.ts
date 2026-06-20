const TAKEAWAY_KEYWORDS = [
  "mcdonald",
  "kfc",
  "uber eats",
  "deliveroo",
  "takeaway",
  "pizza hut",
  "subway",
  "grab",
  "foodpanda",
];

export type MealTakeawayRow = {
  mealId: string;
  mealName: string | null;
  foodName: string | null;
  mealSource?: string | null;
};

export function isTakeawayMealRow(row: MealTakeawayRow): boolean {
  if (row.mealSource === "takeaway") return true;
  if (row.mealSource === "home_cooked") return false;

  const text = `${row.mealName ?? ""} ${row.foodName ?? ""}`.toLowerCase();
  return TAKEAWAY_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function countTakeawayMeals(rows: MealTakeawayRow[]): number {
  const takeawayMealIds = new Set<string>();
  for (const row of rows) {
    if (isTakeawayMealRow(row)) {
      takeawayMealIds.add(row.mealId);
    }
  }
  return takeawayMealIds.size;
}

export function computeTakeawayPercent(
  takeawayMeals: number,
  mealsLogged: number,
): { takeawayPercent: number; homeCookedPercent: number } {
  if (mealsLogged <= 0) {
    return { takeawayPercent: 0, homeCookedPercent: 0 };
  }

  const takeawayPercent = Math.min(
    100,
    Math.round((takeawayMeals / mealsLogged) * 100),
  );
  return {
    takeawayPercent,
    homeCookedPercent: 100 - takeawayPercent,
  };
}
