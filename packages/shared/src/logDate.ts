export const MAX_LOG_PAST_DAYS = 90;

export function todayDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dateKeyFromIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function isValidLogDateKey(dateKey: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const today = todayDateKey(now);
  if (dateKey > today) return false;
  const min = new Date(now);
  min.setUTCDate(min.getUTCDate() - MAX_LOG_PAST_DAYS);
  return dateKey >= todayDateKey(min);
}

export function loggedAtForDateKey(
  dateKey: string,
  mealType?: string | null,
): string {
  const hour =
    mealType === "breakfast"
      ? 8
      : mealType === "lunch"
        ? 12
        : mealType === "dinner"
          ? 19
          : mealType === "snack" || mealType === "beverage" || mealType === "dessert"
            ? 15
            : 12;
  return new Date(`${dateKey}T${String(hour).padStart(2, "0")}:30:00.000Z`).toISOString();
}

export function recentLogDateKeys(count = 30, now = new Date()): string[] {
  const keys: string[] = [];
  const cursor = new Date(now);
  for (let i = 0; i < count; i++) {
    keys.push(todayDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return keys;
}

export function formatLogDateLabel(dateKey: string, now = new Date()): string {
  const today = todayDateKey(now);
  const yesterday = todayDateKey(new Date(now.getTime() - 86400000));
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
