/** How far ahead users may pencil in planned meals. */
export const PLAN_MAX_FUTURE_DAYS = 14;

/** How far back free users may log meals or hydration. */
export const FREE_MAX_LOG_PAST_DAYS = 10;
/** How far back paid users may log meals or hydration. */
export const PAID_MAX_LOG_PAST_DAYS = 100;
/** @deprecated Use getMaxLogPastDays(isPaid) instead. */
export const MAX_LOG_PAST_DAYS = PAID_MAX_LOG_PAST_DAYS;

export function getMaxLogPastDays(isPaid: boolean): number {
  return isPaid ? PAID_MAX_LOG_PAST_DAYS : FREE_MAX_LOG_PAST_DAYS;
}

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

export function isValidLogDateKey(
  dateKey: string,
  now = new Date(),
  maxPastDays = FREE_MAX_LOG_PAST_DAYS,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const today = todayDateKey(now);
  if (dateKey > today) return false;
  const min = new Date(now);
  min.setDate(min.getDate() - maxPastDays);
  return dateKey >= todayDateKey(min);
}

export function isValidLogDateKeyForUser(
  dateKey: string,
  isPaid: boolean,
  now = new Date(),
): boolean {
  return isValidLogDateKey(dateKey, now, getMaxLogPastDays(isPaid));
}

/** Future calendar days allowed for planned meals (exclusive of today). */
export function isValidPlanDateKey(
  dateKey: string,
  now = new Date(),
  maxFutureDays = PLAN_MAX_FUTURE_DAYS,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const today = todayDateKey(now);
  if (dateKey <= today) return false;
  const max = offsetLogDateKey(today, maxFutureDays);
  return dateKey <= max;
}

export function planHorizonEndKey(now = new Date()): string {
  return offsetLogDateKey(todayDateKey(now), PLAN_MAX_FUTURE_DAYS);
}

/** Forward-looking date keys for plan pickers (tomorrow first). */
export function upcomingPlanDateKeys(
  count = PLAN_MAX_FUTURE_DAYS,
  now = new Date(),
): string[] {
  const keys: string[] = [];
  const end = planHorizonEndKey(now);
  let cursor = offsetLogDateKey(todayDateKey(now), 1);
  while (cursor <= end && keys.length < count) {
    keys.push(cursor);
    cursor = offsetLogDateKey(cursor, 1);
  }
  return keys;
}

/** Monday-start week containing `dateKey` (local calendar). */
export function weekStartKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = d.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + mondayOffset);
  return dateKeyFromDate(d);
}

/** Seven consecutive days starting Monday of the week containing `anchorDateKey`. */
export function planWeekDateKeys(anchorDateKey: string): string[] {
  const start = weekStartKey(anchorDateKey);
  return enumerateLogDateKeys(start, offsetLogDateKey(start, 6));
}

export function formatPlanDateLabel(dateKey: string, now = new Date()): string {
  const today = todayDateKey(now);
  const tomorrow = offsetLogDateKey(today, 1);
  if (dateKey === tomorrow) return "Tomorrow";
  return formatLogDateLabel(dateKey, now);
}

export function defaultMealHour(mealType?: string | null): number {
  if (mealType === "breakfast") return 8;
  if (mealType === "lunch") return 12;
  if (mealType === "dinner") return 18;
  if (mealType === "snack" || mealType === "beverage" || mealType === "dessert") return 15;
  return 12;
}

export function loggedAtForDateKey(
  dateKey: string,
  mealType?: string | null,
): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, defaultMealHour(mealType), 0, 0, 0).toISOString();
}

/** Keep the clock time from `loggedAt` but move it to `dateKey`. */
export function mergeLoggedAtDateKey(dateKey: string, loggedAt: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const existing = new Date(loggedAt);
  return new Date(
    year,
    month - 1,
    day,
    existing.getHours(),
    existing.getMinutes(),
    0,
    0,
  ).toISOString();
}

/** Replace the clock time on an existing loggedAt while keeping its calendar date. */
export function setLoggedAtTime(loggedAt: string, hours: number, minutes: number): string {
  const existing = new Date(loggedAt);
  return new Date(
    existing.getFullYear(),
    existing.getMonth(),
    existing.getDate(),
    hours,
    minutes,
    0,
    0,
  ).toISOString();
}

/** Prevent future timestamps when logging for today. */
export function clampLoggedAtToNow(loggedAt: string, now = new Date()): string {
  const d = new Date(loggedAt);
  if (Number.isNaN(d.getTime())) return loggedAt;
  if (dateKeyFromIso(loggedAt) === todayDateKey(now) && d.getTime() > now.getTime()) {
    return now.toISOString();
  }
  return loggedAt;
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

/** First calendar day of the month containing `dateKey`. */
export function monthStartKey(dateKey: string): string {
  const [year, month] = dateKey.split("-");
  return `${year}-${month}-01`;
}

/** Last calendar day of the month containing `dateKey`, capped at today. */
export function monthEndKey(dateKey: string, now = new Date()): string {
  const today = todayDateKey(now);
  const [year, month] = dateKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0);
  const end = dateKeyFromDate(lastDay);
  return end > today ? today : end;
}

/** First day of the calendar month before the one containing `dateKey`. */
export function previousMonthStartKey(dateKey: string): string {
  const [year, month] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return dateKeyFromDate(d);
}

/** Last day of the calendar month before the one containing `dateKey`. */
export function previousMonthEndKey(dateKey: string): string {
  return offsetLogDateKey(monthStartKey(dateKey), -1);
}

export function enumerateLogDateKeys(startDateKey: string, endDateKey: string): string[] {
  const keys: string[] = [];
  let cursor = startDateKey;
  while (cursor <= endDateKey) {
    keys.push(cursor);
    cursor = offsetLogDateKey(cursor, 1);
  }
  return keys;
}

export function formatMonthLabel(dateKey: string, now = new Date()): string {
  const today = todayDateKey(now);
  const thisMonthStart = monthStartKey(today);
  const keyMonthStart = monthStartKey(dateKey);
  if (keyMonthStart === thisMonthStart) return "This month";
  if (keyMonthStart === previousMonthStartKey(today)) return "Last month";
  const [year, month] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
