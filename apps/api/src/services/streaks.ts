import { dateKeyFromIso, todayDateKey } from "@lifeplate/shared";

function shiftUtcDayKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetweenUtc(startKey: string, endKey: string): number {
  const start = new Date(`${startKey}T12:00:00.000Z`).getTime();
  const end = new Date(`${endKey}T12:00:00.000Z`).getTime();
  return Math.round((end - start) / 86400000);
}

export function computeStreaksFromDayKeys(dayKeys: string[]): {
  current: number;
  longest: number;
} {
  if (dayKeys.length === 0) return { current: 0, longest: 0 };

  const daySet = new Set(dayKeys);
  const sortedDays = [...daySet].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = daysBetweenUtc(sortedDays[i - 1]!, sortedDays[i]!);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = todayDateKey();
  let current = 0;
  let cursor = today;
  while (daySet.has(cursor)) {
    current++;
    cursor = shiftUtcDayKey(cursor, -1);
  }

  return { current, longest };
}

export function mealDateKey(date: Date): string {
  return dateKeyFromIso(date.toISOString());
}

export { dateKeyFromIso, todayDateKey };
