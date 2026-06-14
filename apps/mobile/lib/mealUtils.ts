import { dateKeyFromIso, formatLogDateLabel, mealTypeLabel, todayDateKey, type MealListSummary } from "@lifeplate/shared";

export function formatDayLabel(iso: string): string {
  return formatLogDateLabel(dateKeyFromIso(iso));
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
    const key = dateKeyFromIso(meal.createdAt);
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
      const anchorIso = dayMeals[0]?.createdAt ?? `${dateKey}T12:00:00.000Z`;

      return {
        dateKey,
        day: formatDayLabel(anchorIso),
        subtitle: new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        isToday: dateKey === todayKey,
        meals: dayMeals,
        hydrationGlasses: hydrationByDate[dateKey] ?? 0,
      };
    });
}

export function groupMealsByDay(
  meals: MealListSummary[],
): { day: string; subtitle: string; dateKey: string; isToday: boolean; meals: MealListSummary[] }[] {
  return buildTimelineDayGroups(meals, {}).map(
    ({ day, subtitle, dateKey, isToday, meals: dayMeals }) => ({
      day,
      subtitle,
      dateKey,
      isToday,
      meals: dayMeals,
    }),
  );
}

export function countMealsThisWeek(meals: MealListSummary[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);
  return meals.filter((meal) => new Date(meal.createdAt) >= cutoff).length;
}

export function mealTypeIcon(
  mealType: string | null | undefined,
):
  | "weather-sunset-up"
  | "white-balance-sunny"
  | "weather-night"
  | "cookie-outline"
  | "silverware-fork-knife" {
  switch (mealType) {
    case "breakfast":
      return "weather-sunset-up";
    case "lunch":
      return "white-balance-sunny";
    case "dinner":
      return "weather-night";
    case "snack":
    case "beverage":
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
