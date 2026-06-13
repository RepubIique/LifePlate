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

export function groupMealsByDay(meals: MealListSummary[]): { day: string; meals: MealListSummary[] }[] {
  const map = new Map<string, MealListSummary[]>();

  for (const meal of meals) {
    const key = new Date(meal.createdAt).toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(meal);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([, dayMeals]) => ({
      day: formatDayLabel(dayMeals[0].createdAt),
      meals: dayMeals,
    }));
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
