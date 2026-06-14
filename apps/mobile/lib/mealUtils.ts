import { mealTypeLabel, type MealListSummary } from "@lifeplate/shared";

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function groupMealsByDay(
  meals: MealListSummary[],
): { day: string; subtitle: string; dateKey: string; isToday: boolean; meals: MealListSummary[] }[] {
  const map = new Map<string, MealListSummary[]>();

  for (const meal of meals) {
    const key = new Date(meal.createdAt).toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(meal);
    map.set(key, list);
  }

  const today = new Date();

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, dayMeals]) => {
      const first = dayMeals[0]!;
      const d = new Date(first.createdAt);
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      return {
        dateKey,
        day: formatDayLabel(first.createdAt),
        subtitle: d.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        isToday,
        meals: dayMeals,
      };
    });
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
