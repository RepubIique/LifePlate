import {
  formatLogDateLabel,
  mealLogDateKey,
  mealTypeLabel,
  offsetLogDateKey,
  todayDateKey,
  type MealListSummary,
} from "@lifeplate/shared";
import { notesSearchText } from "./mealNotesFormat";

/** Most recent meal first — higher sortIndex and later createdAt appear at the top. */
export function sortMealsRecentFirst<T extends MealListSummary>(meals: T[]): T[] {
  return [...meals].sort((a, b) => {
    const sortDiff = (b.sortIndex ?? 0) - (a.sortIndex ?? 0);
    if (sortDiff !== 0) return sortDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function formatDayLabel(dateKey: string): string {
  return formatLogDateLabel(dateKey);
}

export type TimelineDayGroup = {
  day: string;
  subtitle: string;
  dateKey: string;
  isToday: boolean;
  meals: MealListSummary[];
  hydrationGlasses: number;
};

export function buildTimelineDayGroups(
  meals: MealListSummary[],
  hydrationByDate: Record<string, number>,
): TimelineDayGroup[] {
  const mealMap = new Map<string, MealListSummary[]>();

  for (const meal of meals) {
    const key = mealLogDateKey(meal);
    const list = mealMap.get(key) ?? [];
    list.push(meal);
    mealMap.set(key, list);
  }

  const dateKeys = new Set([...mealMap.keys(), ...Object.keys(hydrationByDate)]);
  const todayKey = todayDateKey();

  return [...dateKeys]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((dateKey) => {
      const dayMeals = mealMap.get(dateKey) ?? [];

      return {
        dateKey,
        day: formatDayLabel(dateKey),
        subtitle: new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        isToday: dateKey === todayKey,
        meals: sortMealsRecentFirst(dayMeals),
        hydrationGlasses: hydrationByDate[dateKey] ?? 0,
      };
    });
}

export function mealMatchesTimelineSearch(meal: MealListSummary, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystacks = [
    meal.mealName,
    formatMealTypeLabel(meal.mealType),
    meal.sharedByName,
    notesSearchText(meal.notes),
  ];

  return haystacks.some((text) => (text ?? "").toLowerCase().includes(normalized));
}

export function timelineDayMatchesSearch(
  group: Pick<TimelineDayGroup, "day" | "subtitle" | "dateKey">,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystacks = [group.day, group.subtitle, group.dateKey];
  return haystacks.some((text) => text.toLowerCase().includes(normalized));
}

export function countMealsThisWeek(meals: MealListSummary[]): number {
  const cutoffKey = offsetLogDateKey(todayDateKey(), -7);
  return meals.filter((meal) => mealLogDateKey(meal) >= cutoffKey).length;
}

export function mealTypeIcon(
  mealType: string | null | undefined,
):
  | "weather-sunset-up"
  | "white-balance-sunny"
  | "weather-night"
  | "cookie-outline"
  | "cup-outline"
  | "silverware-fork-knife" {
  switch (mealType) {
    case "breakfast":
      return "weather-sunset-up";
    case "lunch":
      return "white-balance-sunny";
    case "dinner":
      return "weather-night";
    case "beverage":
      return "cup-outline";
    case "snack":
    case "dessert":
      return "cookie-outline";
    default:
      return "silverware-fork-knife";
  }
}

export function formatMealTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatMealTypeLabel(mealType: string | null | undefined): string {
  return mealTypeLabel(mealType);
}
