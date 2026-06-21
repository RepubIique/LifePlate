import { dateKeyFromIso, enumerateLogDateKeys, offsetLogDateKey, todayDateKey } from "./logDate.js";

/** Calendar days of meal logging included on the free tier (signup day counts as day 1). */
export const FREE_LOGGING_DAYS = 7;

export type LoggingAccess = {
  loggingLocked: boolean;
  freeLoggingDaysRemaining: number;
};

export function utcDateKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function utcTodayDateKey(date = new Date()): string {
  return utcDateKeyFromDate(date);
}

export function utcDateKeyFromIso(iso: string): string {
  return utcDateKeyFromDate(new Date(iso));
}

export function freeLoggingLastDateKey(accountCreatedAt: string): string {
  const startKey = dateKeyFromIso(accountCreatedAt);
  return offsetLogDateKey(startKey, FREE_LOGGING_DAYS - 1);
}

export function freeLoggingLastDateKeyUtc(accountCreatedAt: string): string {
  const startKey = utcDateKeyFromIso(accountCreatedAt);
  return offsetLogDateKey(startKey, FREE_LOGGING_DAYS - 1);
}

export function computeLoggingAccess(input: {
  isPaid: boolean;
  createdAt: string;
  todayKey?: string;
  /** Server enforcement uses UTC calendar days for a single global trial boundary. */
  utcCalendar?: boolean;
}): LoggingAccess {
  if (input.isPaid) {
    return { loggingLocked: false, freeLoggingDaysRemaining: 0 };
  }

  const today =
    input.todayKey ??
    (input.utcCalendar ? utcTodayDateKey() : todayDateKey());
  const lastFreeDay = input.utcCalendar
    ? freeLoggingLastDateKeyUtc(input.createdAt)
    : freeLoggingLastDateKey(input.createdAt);

  if (today > lastFreeDay) {
    return { loggingLocked: true, freeLoggingDaysRemaining: 0 };
  }

  return {
    loggingLocked: false,
    freeLoggingDaysRemaining: enumerateLogDateKeys(today, lastFreeDay).length,
  };
}
