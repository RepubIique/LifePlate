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
import { resolvedPlantServes } from "./taxonomy.js";

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
  const carbsTarget = Math.max(80, Math.round(targets.dailyCalories / 8));
  const fatTarget = Math.max(35, Math.round(targets.dailyCalories / 30));

  return {
    protein: progressPercent(totals.protein, targets.dailyProteinG),
    fibre: progressPercent(totals.fibre, targets.dailyFibreG),
    plants: progressPercent(resolvedPlantServes(classification), targets.dailyPlantServes),
    carbs: progressPercent(totals.carbs, carbsTarget),
    fat: progressPercent(totals.fat, fatTarget),
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

export function buildWeekComparison(
  current: PeriodSnapshot,
  previous: PeriodSnapshot,
): PeriodComparison {
  return {
    period: "week",
    currentLabel: "This week",
    previousLabel: "Last week",
    current,
    previous,
  };
}

export function buildMonthComparison(
  current: PeriodSnapshot,
  previous: PeriodSnapshot,
): PeriodComparison {
  return {
    period: "month",
    currentLabel: "This month",
    previousLabel: "Last month",
    current,
    previous,
  };
}

const EMPTY_PILLARS: ComparisonPillarMetrics = {
  protein: 0,
  fibre: 0,
  plants: 0,
  carbs: 0,
  fat: 0,
  hydration: 0,
};

export function aggregateDailySnapshots(
  label: string,
  dateKey: string,
  snapshots: PeriodSnapshot[],
): PeriodSnapshot {
  const withData = snapshots.filter((snapshot) => snapshot.hasData);
  if (withData.length === 0) {
    return {
      label,
      date: dateKey,
      score: 0,
      mealsCount: 0,
      pillars: { ...EMPTY_PILLARS },
      hasData: false,
    };
  }

  const averagePillar = (key: keyof ComparisonPillarMetrics): number =>
    Math.round(
      withData.reduce((sum, snapshot) => sum + snapshot.pillars[key], 0) / withData.length,
    );

  return {
    label,
    date: dateKey,
    score: Math.round(
      withData.reduce((sum, snapshot) => sum + snapshot.score, 0) / withData.length,
    ),
    mealsCount: withData.reduce((sum, snapshot) => sum + snapshot.mealsCount, 0),
    pillars: {
      protein: averagePillar("protein"),
      fibre: averagePillar("fibre"),
      plants: averagePillar("plants"),
      carbs: averagePillar("carbs"),
      fat: averagePillar("fat"),
      hydration: averagePillar("hydration"),
    },
    hasData: true,
  };
}

export function scoreDelta(comparison: PeriodComparison): number {
  return comparison.current.score - comparison.previous.score;
}

function previousPeriodName(period: ComparisonPeriod): string {
  if (period === "week") return "last week";
  if (period === "month") return "last month";
  return "yesterday";
}

export function buildComparisonSummary(comparison: PeriodComparison): string {
  const { current, previous, period } = comparison;
  const previousName = previousPeriodName(period);

  if (!current.hasData) {
    if (period === "day") {
      return "Log a meal or water today to start tracking your progress.";
    }
    if (period === "week") {
      return "Log meals this week to start tracking your weekly progress.";
    }
    return "Log meals this month to start tracking your monthly progress.";
  }

  if (!previous.hasData) {
    if (period === "day") {
      return "Keep logging — tomorrow you'll see how today compares.";
    }
    if (period === "week") {
      return "Keep logging — next week you'll see how this week compares.";
    }
    return "Keep logging — next month you'll see how this month compares.";
  }

  const delta = scoreDelta(comparison);
  if (delta >= 10) {
    return `You're ${delta} points ahead of ${previousName} — strong momentum.`;
  }
  if (delta >= 3) {
    return `Slightly ahead of ${previousName} (+${delta} points). Keep it up.`;
  }
  if (delta <= -10) {
    return `${Math.abs(delta)} points below ${previousName} — small tweaks can turn it around.`;
  }
  if (delta <= -3) {
    return `A little behind ${previousName} (${delta} points). Room to catch up.`;
  }
  return `Tracking similarly to ${previousName} — consistency is the win.`;
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
