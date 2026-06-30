import type { MealListItem, UserProfile } from "@lifeplate/shared";
import { mealLogDateKey } from "@lifeplate/shared";
import {
  computeReportMetrics,
  hydrationForWindow,
} from "./computeReportMetrics";
import type { ReportTemplateId } from "./reportTemplates";
import type { ReportSourceBundle } from "./reportSourceCache";
import { resolveReportWindow, type ReportWindowId } from "./reportWindows";
import type { PdfReportData } from "./types";

export type AssembleReportDataOptions = {
  fullReport?: boolean;
  windowId?: ReportWindowId;
  customRange?: { startKey: string; endKey: string };
  template?: ReportTemplateId;
  /** Pin "today" for deterministic report assembly in tests. */
  now?: Date;
};

function mealsInWindow(meals: MealListItem[], startKey: string, endKey: string): MealListItem[] {
  return meals
    .filter((meal) => {
      const key = mealLogDateKey(meal);
      return key >= startKey && key <= endKey;
    })
    .sort((a, b) => {
      const dateCompare = mealLogDateKey(b).localeCompare(mealLogDateKey(a));
      if (dateCompare !== 0) return dateCompare;
      return (b.sortIndex ?? 0) - (a.sortIndex ?? 0);
    });
}

export function assembleReportData(
  profile: UserProfile,
  source: ReportSourceBundle,
  options?: AssembleReportDataOptions,
): PdfReportData {
  const fullReport = options?.fullReport ?? false;
  const windowId = options?.windowId ?? "this_week";
  const template = options?.template ?? "trend";
  const window = resolveReportWindow(windowId, options?.customRange, options?.now);

  const metrics = computeReportMetrics(profile, window, source.allMeals, source.hydrationDays);
  const windowMeals = fullReport ? mealsInWindow(source.allMeals, window.startKey, window.endKey) : [];
  const hydrationDaysInWindow = hydrationForWindow(source.hydrationDays, window);

  return {
    profile,
    window,
    template,
    metrics,
    coachInsight: source.coachInsight,
    meals: windowMeals,
    hydrationDays: hydrationDaysInWindow,
    exportedAt: new Date().toISOString(),
    fullReport,
  };
}
