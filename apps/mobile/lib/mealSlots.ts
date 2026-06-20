import { compareMealsTimeline, inferMealType, type MealListSummary } from "@lifeplate/shared";

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

  let highestFilledIndex = -1;
  for (const slot of MEAL_SLOTS) {
    if (filled.has(slot.key)) {
      highestFilledIndex = Math.max(highestFilledIndex, slotIndex(slot.key));
    }
  }

  const inferredIndex = slotIndex(asSlot);

  if (!filled.has(asSlot) && inferredIndex >= highestFilledIndex) {
    return asSlot;
  }

  for (let i = highestFilledIndex + 1; i <= inferredIndex; i += 1) {
    const key = MEAL_SLOTS[i]!.key;
    if (!filled.has(key)) return key;
  }

  if (
    (inferred === "snack" || inferred === "dessert" || inferred === "beverage") &&
    !filled.has("snack")
  ) {
    return "snack";
  }

  return null;
}

function slotIndex(key: MealSlotKey): number {
  return MEAL_SLOTS.findIndex((slot) => slot.key === key);
}

export function mealSlotKey(
  mealType: string | null | undefined,
): MealSlotKey | null {
  for (const slot of MEAL_SLOTS) {
    if (mealMatchesSlot(mealType, slot.key)) return slot.key;
  }
  return null;
}

export function mealsShareDisplaySlot(
  a: MealListSummary,
  b: MealListSummary,
): boolean {
  const slotA = mealSlotKey(a.mealType);
  const slotB = mealSlotKey(b.mealType);
  if (slotA == null && slotB == null) return true;
  return slotA != null && slotA === slotB;
}

function mealsForSlot<T extends MealListSummary>(meals: T[], slot: MealSlotKey): T[] {
  return meals
    .filter((meal) => mealMatchesSlot(meal.mealType, slot))
    .sort(compareMealsTimeline);
}

function unmatchedMeals<T extends MealListSummary>(meals: T[]): T[] {
  return meals
    .filter((meal) => mealSlotKey(meal.mealType) == null)
    .sort(compareMealsTimeline);
}

/** Order meals breakfast → lunch → dinner → snack, then unknown types. */
export function sortMealsByDaySlots<T extends MealListSummary>(meals: T[]): T[] {
  const ordered = MEAL_SLOTS.flatMap((slot) => mealsForSlot(meals, slot.key));
  ordered.push(...unmatchedMeals(meals));
  return ordered;
}

export function mealsInDaySlot<T extends MealListSummary>(
  meals: T[],
  slot: MealSlotKey,
): T[] {
  return mealsForSlot(meals, slot);
}

export function unmatchedDayMeals<T extends MealListSummary>(meals: T[]): T[] {
  return unmatchedMeals(meals);
}
