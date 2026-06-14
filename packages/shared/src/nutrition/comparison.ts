import type {
  ComparisonPeriod,
  ComparisonPillarMetrics,
  DailyTotals,
  ExtendedNutritionTargets,
  FoodClassification,
  PeriodComparison,
  PeriodSnapshot,
} from "./types.js";
import { computeNutritionScore } from "./scoring.js";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function progressPercent(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round(clamp01(consumed / target) * 100);
}

export function buildComparisonPillars(
  totals: DailyTotals,
  classification: FoodClassification,
  hydrationGlasses: number,
  targets: ExtendedNutritionTargets,
): ComparisonPillarMetrics {
  return {
    protein: progressPercent(totals.protein, targets.dailyProteinG),
    fibre: progressPercent(totals.fibre, targets.dailyFibreG),
    plants: progressPercent(classification.plants.length, targets.dailyPlantServes),
    hydration: progressPercent(hydrationGlasses, targets.dailyHydrationGlasses),
  };
}

export function buildPeriodSnapshot(
  label: string,
  dateKey: string,
  totals: DailyTotals,
  classification: FoodClassification,
  hydrationGlasses: number,
  targets: ExtendedNutritionTargets,
): PeriodSnapshot {
  const pillars = buildComparisonPillars(totals, classification, hydrationGlasses, targets);
  const score = computeNutritionScore(
    totals,
    targets,
    classification,
    hydrationGlasses,
  );

  return {
    label,
    date: dateKey,
    score,
    mealsCount: totals.mealsCount,
    pillars,
    hasData: totals.mealsCount > 0 || hydrationGlasses > 0,
  };
}

export function buildDayComparison(
  current: PeriodSnapshot,
  previous: PeriodSnapshot,
): PeriodComparison {
  return {
    period: "day",
    currentLabel: "Today",
    previousLabel: "Yesterday",
    current,
    previous,
  };
}

export function scoreDelta(comparison: PeriodComparison): number {
  return comparison.current.score - comparison.previous.score;
}

export function buildComparisonSummary(comparison: PeriodComparison): string {
  const { current, previous } = comparison;

  if (!current.hasData) {
    return "Log a meal or water today to start tracking your progress.";
  }

  if (!previous.hasData) {
    return "Keep logging — tomorrow you'll see how today compares.";
  }

  const delta = scoreDelta(comparison);
  if (delta >= 10) {
    return `You're ${delta} points ahead of yesterday — strong momentum.`;
  }
  if (delta >= 3) {
    return `Slightly ahead of yesterday (+${delta} points). Keep it up.`;
  }
  if (delta <= -10) {
    return `${Math.abs(delta)} points below yesterday — small tweaks can turn it around.`;
  }
  if (delta <= -3) {
    return `A little behind yesterday (${delta} points). Room to catch up.`;
  }
  return "Tracking similarly to yesterday — consistency is the win.";
}

export function formatScoreDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

export function pillarDelta(
  current: ComparisonPillarMetrics,
  previous: ComparisonPillarMetrics,
  key: keyof ComparisonPillarMetrics,
): number {
  return current[key] - previous[key];
}

export const COMPARISON_PERIODS: ComparisonPeriod[] = ["day", "week", "month"];
