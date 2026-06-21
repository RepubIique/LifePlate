import type { HydrationDayRecord, MealListItem, UserProfile } from "@lifeplate/shared";
import type {
  ComputedReportMetrics,
  DailyScorePoint,
  MacroPeriodAverages,
  PatternsToWatch,
  WindowInsights,
} from "./computeReportMetrics";
import type { ReportTemplateId } from "./reportTemplates";
import type { ReportWindowSpec } from "./reportWindows";

export type { DailyScorePoint, MacroPeriodAverages, PatternsToWatch, WindowInsights };

export type PdfReportData = {
  profile: UserProfile;
  window: ReportWindowSpec;
  template: ReportTemplateId;
  metrics: ComputedReportMetrics;
  coachInsight: string;
  meals: MealListItem[];
  hydrationDays: HydrationDayRecord[];
  exportedAt: string;
  fullReport: boolean;
};

/** @deprecated Use window.label */
export function reportPeriodLabel(data: PdfReportData): string {
  return data.window.label;
}
