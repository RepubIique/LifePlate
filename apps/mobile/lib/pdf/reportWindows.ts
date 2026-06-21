import {
  currentWeekStartKey,
  monthEndKey,
  monthStartKey,
  offsetLogDateKey,
  previousMonthEndKey,
  previousMonthStartKey,
  todayDateKey,
} from "@lifeplate/shared";

export type ReportWindowId =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export type ReportWindowSpec = {
  id: ReportWindowId;
  startKey: string;
  endKey: string;
  label: string;
  currentLabel: string;
  previousLabel: string;
  previousStartKey: string;
  previousEndKey: string;
};

function formatShortDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function rangeLabel(startKey: string, endKey: string): string {
  return `${formatShortDate(startKey)} – ${formatShortDate(endKey)}`;
}

function daySpan(startKey: string, endKey: string): number {
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function previousRange(startKey: string, endKey: string): { start: string; end: string } {
  const span = daySpan(startKey, endKey);
  const previousEnd = offsetLogDateKey(startKey, -1);
  const previousStart = offsetLogDateKey(previousEnd, -(span - 1));
  return { start: previousStart, end: previousEnd };
}

export function resolveReportWindow(
  id: ReportWindowId,
  custom?: { startKey: string; endKey: string },
  now = new Date(),
): ReportWindowSpec {
  const today = todayDateKey(now);

  if (id === "this_week") {
    const startKey = currentWeekStartKey(now);
    const prev = previousRange(startKey, today);
    return {
      id,
      startKey,
      endKey: today,
      label: rangeLabel(startKey, today),
      currentLabel: "This week",
      previousLabel: "Last week",
      previousStartKey: prev.start,
      previousEndKey: prev.end,
    };
  }

  if (id === "last_week") {
    const thisWeekStart = currentWeekStartKey(now);
    const endKey = offsetLogDateKey(thisWeekStart, -1);
    const startKey = offsetLogDateKey(endKey, -6);
    const prev = previousRange(startKey, endKey);
    return {
      id,
      startKey,
      endKey,
      label: rangeLabel(startKey, endKey),
      currentLabel: "Last week",
      previousLabel: "Prior week",
      previousStartKey: prev.start,
      previousEndKey: prev.end,
    };
  }

  if (id === "this_month") {
    const startKey = monthStartKey(today);
    const prevStart = previousMonthStartKey(today);
    const prevEnd = previousMonthEndKey(today);
    return {
      id,
      startKey,
      endKey: today,
      label: rangeLabel(startKey, today),
      currentLabel: "This month",
      previousLabel: "Last month",
      previousStartKey: prevStart,
      previousEndKey: prevEnd,
    };
  }

  if (id === "last_month") {
    const startKey = previousMonthStartKey(today);
    const endKey = previousMonthEndKey(today);
    const prevStart = previousMonthStartKey(startKey);
    const prevEnd = monthEndKey(prevStart, now);
    return {
      id,
      startKey,
      endKey,
      label: rangeLabel(startKey, endKey),
      currentLabel: "Last month",
      previousLabel: "Prior month",
      previousStartKey: prevStart,
      previousEndKey: prevEnd,
    };
  }

  const startKey = custom?.startKey ?? currentWeekStartKey(now);
  const endKey = custom?.endKey ?? today;
  const prev = previousRange(startKey, endKey);
  return {
    id: "custom",
    startKey,
    endKey,
    label: rangeLabel(startKey, endKey),
    currentLabel: "Selected period",
    previousLabel: "Prior period",
    previousStartKey: prev.start,
    previousEndKey: prev.end,
  };
}

export const REPORT_WINDOW_OPTIONS: Array<{ id: ReportWindowId; label: string }> = [
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "custom", label: "Custom range" },
];

export function enumerateWindowDays(window: ReportWindowSpec): string[] {
  const keys: string[] = [];
  let cursor = window.startKey;
  while (cursor <= window.endKey) {
    keys.push(cursor);
    cursor = offsetLogDateKey(cursor, 1);
  }
  return keys;
}
