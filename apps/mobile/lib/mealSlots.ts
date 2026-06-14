import { inferMealType, type MealListSummary } from "@lifeplate/shared";

export const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: "weather-sunset-up" as const },
  { key: "lunch", label: "Lunch", icon: "white-balance-sunny" as const },
  { key: "dinner", label: "Dinner", icon: "weather-night" as const },
  { key: "snack", label: "Snack", icon: "cookie-outline" as const },
] as const;

export type MealSlotKey = (typeof MEAL_SLOTS)[number]["key"];

const SNACK_ALIASES = new Set(["snack", "beverage", "dessert"]);

export function mealMatchesSlot(
  mealType: string | null | undefined,
  slot: MealSlotKey,
): boolean {
  if (!mealType) return false;
  if (slot === "snack") return SNACK_ALIASES.has(mealType);
  return mealType === slot;
}

export function getFilledSlots(meals: MealListSummary[]): Set<MealSlotKey> {
  const filled = new Set<MealSlotKey>();
  for (const slot of MEAL_SLOTS) {
    if (meals.some((m) => mealMatchesSlot(m.mealType, slot.key))) {
      filled.add(slot.key);
    }
  }
  return filled;
}

export function getSuggestedSlot(
  filled: Set<MealSlotKey>,
  now = new Date(),
): MealSlotKey | null {
  const inferred = inferMealType(now);
  const asSlot: MealSlotKey =
    inferred === "beverage" || inferred === "dessert" ? "snack" : inferred;

  if (!filled.has(asSlot)) return asSlot;

  for (const slot of MEAL_SLOTS) {
    if (!filled.has(slot.key)) return slot.key;
  }
  return null;
}
