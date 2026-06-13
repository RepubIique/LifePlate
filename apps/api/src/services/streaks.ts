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
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  let current = 0;
  const cursor = new Date(today);
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}

export function mealDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}
