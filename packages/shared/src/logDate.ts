export const MAX_LOG_PAST_DAYS = 90;

function dateKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayDateKey(date = new Date()): string {
  return dateKeyFromDate(date);
}

export function dateKeyFromIso(iso: string): string {
  return dateKeyFromDate(new Date(iso));
}

export function isValidLogDateKey(dateKey: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const today = todayDateKey(now);
  if (dateKey > today) return false;
  const min = new Date(now);
  min.setDate(min.getDate() - MAX_LOG_PAST_DAYS);
  return dateKey >= todayDateKey(min);
}

export function loggedAtForDateKey(
  dateKey: string,
  mealType?: string | null,
): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const hour =
    mealType === "breakfast"
      ? 8
      : mealType === "lunch"
        ? 12
        : mealType === "dinner"
          ? 18
          : mealType === "snack" || mealType === "beverage" || mealType === "dessert"
            ? 15
            : 12;
  return new Date(year, month - 1, day, hour, 0, 0, 0).toISOString();
}

export type MealTimelineFields = {
  createdAt: string;
  logDate?: string;
  sortIndex?: number;
};

export function mealLogDateKey(meal: MealTimelineFields): string {
  return meal.logDate ?? dateKeyFromIso(meal.createdAt);
}

/** Newer calendar days first; within a day, lower sortIndex is higher on the timeline. */
export function compareMealsTimeline(
  a: MealTimelineFields,
  b: MealTimelineFields,
): number {
  const dateA = mealLogDateKey(a);
  const dateB = mealLogDateKey(b);
  if (dateA !== dateB) return dateA < dateB ? 1 : -1;

  const sortA = a.sortIndex ?? 0;
  const sortB = b.sortIndex ?? 0;
  if (sortA !== sortB) return sortA - sortB;

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** Assign within-day timeline order without mutating logged timestamps. */
export function applyMealSortIndices<T extends MealTimelineFields>(
  orderedMeals: T[],
): T[] {
  return orderedMeals.map((meal, index) => ({
    ...meal,
    sortIndex: index,
  }));
}

export function recentLogDateKeys(count = 30, now = new Date()): string[] {
  const keys: string[] = [];
  const cursor = new Date(now);
  for (let i = 0; i < count; i++) {
    keys.push(dateKeyFromDate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return keys;
}

export function formatLogDateLabel(dateKey: string, now = new Date()): string {
  const today = todayDateKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = todayDateKey(yesterdayDate);
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function offsetLogDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return dateKeyFromDate(d);
}

/** Rolling 7-day window start (today minus 6 days). */
export function currentWeekStartKey(now = new Date()): string {
  return offsetLogDateKey(todayDateKey(now), -6);
}
