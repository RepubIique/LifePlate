import type { MealListSummary } from "@lifeplate/shared";
import {
  enumerateLogDateKeys,
  offsetLogDateKey,
  planHorizonEndKey,
  planWeekDateKeys,
  todayDateKey,
  weekStartKey,
} from "@lifeplate/shared";

/** Week offsets for the 2-week planning horizon (0 = this week, 1 = next). */
export const PLAN_WEEK_OFFSETS = [0, 1] as const;

export function planWeekLabel(weekOffset: number): string {
  return weekOffset === 0 ? "This week" : "Next week";
}

export function planWeekAnchorKey(weekOffset: number, now = new Date()): string {
  const today = todayDateKey(now);
  return weekStartKey(offsetLogDateKey(today, weekOffset * 7));
}

/** Calendar days in a plan week that fall inside the planning horizon. */
export function planWeekVisibleDateKeys(weekOffset: number, now = new Date()): string[] {
  const today = todayDateKey(now);
  const horizonEnd = planHorizonEndKey(now);
  const weekKeys = planWeekDateKeys(planWeekAnchorKey(weekOffset, now));
  return weekKeys.filter((dateKey) => dateKey > today && dateKey <= horizonEnd);
}

export function planHorizonDateKeys(now = new Date()): string[] {
  const today = todayDateKey(now);
  const horizonEnd = planHorizonEndKey(now);
  if (horizonEnd <= today) return [];
  return enumerateLogDateKeys(offsetLogDateKey(today, 1), horizonEnd);
}

/** Client-side filter — use with MealsContext instead of a separate plan API fetch. */
export function selectPlannedMealsInHorizon(
  meals: MealListSummary[],
  now = new Date(),
): MealListSummary[] {
  const today = todayDateKey(now);
  const from = offsetLogDateKey(today, 1);
  const to = planHorizonEndKey(now);
  return meals.filter(
    (meal) =>
      meal.status === "planned" && meal.logDate >= from && meal.logDate <= to,
  );
}
