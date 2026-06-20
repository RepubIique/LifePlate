import { offsetLogDateKey, todayDateKey } from "@lifeplate/shared";

export function currentWeekStartKey(now = new Date()): string {
  return offsetLogDateKey(todayDateKey(now), -6);
}
