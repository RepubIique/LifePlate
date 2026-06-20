import type { MealListItem } from "@lifeplate/shared";
import {
  getFilledSlots,
  getSuggestedSlot,
  MEAL_SLOTS,
  mealsInDaySlot,
  sortMealsByDaySlots,
  unmatchedDayMeals,
  type MealSlotKey,
} from "@/lib/mealSlots";

export type HomeTimelineMealItem = {
  kind: "meal";
  meal: MealListItem;
};

export type HomeTimelineSuggestedItem = {
  kind: "suggested";
  slot: MealSlotKey;
};

export type HomeTimelineItem = HomeTimelineMealItem | HomeTimelineSuggestedItem;

export function buildHomeMealsTimeline(
  meals: MealListItem[],
  options: { highlightNextSlot: boolean; now?: Date },
): {
  items: HomeTimelineItem[];
  suggestedSlot: MealSlotKey | null;
} {
  const filled = getFilledSlots(meals);
  const suggestedSlot = options.highlightNextSlot
    ? getSuggestedSlot(filled, options.now)
    : null;

  if (!suggestedSlot) {
    return {
      suggestedSlot: null,
      items: sortMealsByDaySlots(meals).map((meal) => ({
        kind: "meal",
        meal,
      })),
    };
  }

  const items: HomeTimelineItem[] = [];

  for (const slot of MEAL_SLOTS) {
    for (const meal of mealsInDaySlot(meals, slot.key)) {
      items.push({ kind: "meal", meal });
    }
    if (slot.key === suggestedSlot) {
      items.push({ kind: "suggested", slot: suggestedSlot });
    }
  }

  for (const meal of unmatchedDayMeals(meals)) {
    items.push({ kind: "meal", meal });
  }

  return { items, suggestedSlot };
}
