import type { TrendStatus, WeeklyTrendItem } from "./types.js";
import type { FoodClassification } from "./types.js";

export type WeeklyMetrics = {
  avgDailyProtein: number;
  proteinTarget: number;
  avgPlantFoods: number;
  plantTarget: number;
  gutScore: number;
  processedPercent: number;
  omega3Days: number;
  daysWithMeals: number;
};

function trendFromRatio(ratio: number): TrendStatus {
  if (ratio >= 0.85) return "on_track";
  if (ratio >= 0.55) return "moderate";
  return "needs_improvement";
}

export function buildWeeklyTrends(metrics: WeeklyMetrics): WeeklyTrendItem[] {
  const muscleRatio =
    metrics.proteinTarget > 0 ? metrics.avgDailyProtein / metrics.proteinTarget : 0;
  const plantRatio =
    metrics.plantTarget > 0 ? metrics.avgPlantFoods / metrics.plantTarget : 0;
  const gutRatio = metrics.gutScore / 10;
  const omegaRatio =
    metrics.daysWithMeals > 0 ? metrics.omega3Days / metrics.daysWithMeals : 0;

  return [
    { label: "Muscle Support", status: trendFromRatio(muscleRatio) },
    { label: "Gut Health", status: trendFromRatio(gutRatio) },
    { label: "Plant Diversity", status: trendFromRatio(plantRatio) },
    { label: "Omega-3 Intake", status: trendFromRatio(omegaRatio) },
  ];
}

export function weeklyGutScore(classification: FoodClassification): number {
  let score = 4;
  if (classification.fermented.length > 0) score += 3;
  if (classification.prebiotic.length > 0) score += 3;
  return Math.min(10, score);
}
