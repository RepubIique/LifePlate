import type {
  DailyTotals,
  EnergyMetric,
  ExtendedNutritionTargets,
  FoodClassification,
  NutritionGaps,
  PillarProgress,
  PillarStatus,
  ScoreStatus,
} from "./types.js";
import {
  DEFAULT_DAILY_HYDRATION_GLASSES,
  DEFAULT_PROTEIN_SERVES,
} from "./types.js";
import {
  formatMacroEquivalents,
  stillNeededForMacro,
} from "./equivalents.js";
import { defaultExtendedNutritionTargets } from "./targets.js";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function pillarStatus(progress: number): PillarStatus {
  if (progress >= 0.85) return "good";
  if (progress >= 0.55) return "moderate";
  return "low";
}

function energyBalanceProgress(calories: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = calories / target;
  if (ratio >= 0.85 && ratio <= 1.15) return 1;
  if (ratio < 0.85) return clamp01(ratio / 0.85);
  const over = ratio - 1.15;
  return clamp01(1 - over / 0.35);
}

function gutHealthProgress(classification: FoodClassification): number {
  let score = 0;
  if (classification.fermented.length > 0) score += 0.55;
  if (classification.prebiotic.length > 0) score += 0.45;
  return clamp01(score);
}

export function computeNutritionGaps(
  totals: DailyTotals,
  targets: ExtendedNutritionTargets,
  classification: FoodClassification,
  hydrationGlasses: number,
): NutritionGaps {
  return {
    proteinG: Math.max(0, targets.dailyProteinG - totals.protein),
    fibreG: Math.max(0, targets.dailyFibreG - totals.fibre),
    plantServes: Math.max(0, targets.dailyPlantServes - classification.plants.length),
    hydrationGlasses: Math.max(0, targets.dailyHydrationGlasses - hydrationGlasses),
    caloriesGap: totals.calories - targets.dailyCalories,
  };
}

export function computeNutritionScore(
  totals: DailyTotals,
  targets: ExtendedNutritionTargets,
  classification: FoodClassification,
  hydrationGlasses: number,
): number {
  const protein = clamp01(totals.protein / targets.dailyProteinG);
  const fibre = clamp01(totals.fibre / targets.dailyFibreG);
  const plants = clamp01(classification.plants.length / targets.dailyPlantServes);
  const hydration = clamp01(hydrationGlasses / targets.dailyHydrationGlasses);
  const energy = energyBalanceProgress(totals.calories, targets.dailyCalories);
  const gut = gutHealthProgress(classification);

  const weighted =
    protein * 25 +
    fibre * 25 +
    plants * 20 +
    hydration * 15 +
    energy * 10 +
    gut * 5;

  return Math.round(weighted);
}

export function scoreStatus(score: number): ScoreStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  return "needs_work";
}

export function scoreStatusEmoji(status: ScoreStatus): string {
  if (status === "excellent") return "🟢";
  if (status === "good") return "🟢";
  return "🟡";
}

export function buildProteinPillar(
  totals: DailyTotals,
  targets: ExtendedNutritionTargets,
): PillarProgress {
  const progress = clamp01(totals.protein / targets.dailyProteinG);
  const serveTarget = DEFAULT_PROTEIN_SERVES;
  const serveSize = targets.dailyProteinG / serveTarget;
  const currentServes = serveSize > 0 ? Math.min(serveTarget, Math.round(totals.protein / serveSize)) : 0;

  return {
    label: "Protein",
    consumed: Math.round(totals.protein),
    target: targets.dailyProteinG,
    unit: "g",
    serves: { current: currentServes, target: serveTarget },
    progress,
    status: pillarStatus(progress),
    equivalents: formatMacroEquivalents(totals.protein, "protein"),
    stillNeeded: stillNeededForMacro("protein", progress),
    tip: progress >= 0.85
      ? "Supports muscle, recovery and metabolism"
      : "Supports muscle, recovery and metabolism",
  };
}

export function buildFibrePillar(
  totals: DailyTotals,
  targets: ExtendedNutritionTargets,
): PillarProgress {
  const progress = clamp01(totals.fibre / targets.dailyFibreG);

  return {
    label: "Fibre",
    consumed: Math.round(totals.fibre),
    target: targets.dailyFibreG,
    unit: "g",
    progress,
    status: pillarStatus(progress),
    equivalents: formatMacroEquivalents(totals.fibre, "fibre"),
    stillNeeded: stillNeededForMacro("fibre", progress),
    tip:
      progress >= 0.85
        ? "Great fibre intake for gut and heart health"
        : "Your gut may benefit from more fibre today",
  };
}

export function buildPlantsPillar(
  classification: FoodClassification,
  targets: ExtendedNutritionTargets,
): PillarProgress {
  const consumed = classification.plants.length;
  const progress = clamp01(consumed / targets.dailyPlantServes);

  return {
    label: "Plants",
    consumed,
    target: targets.dailyPlantServes,
    unit: "serves",
    serves: { current: consumed, target: targets.dailyPlantServes },
    progress,
    status: pillarStatus(progress),
    sources: classification.plants.slice(0, 6),
    tip: progress >= 0.85 ? "Strong plant diversity today" : "Aim for more colour diversity",
  };
}

export function buildHydrationPillar(
  hydrationGlasses: number,
  targets: ExtendedNutritionTargets,
): PillarProgress {
  const progress = clamp01(hydrationGlasses / targets.dailyHydrationGlasses);

  return {
    label: "Hydration",
    consumed: hydrationGlasses,
    target: targets.dailyHydrationGlasses,
    unit: "glasses",
    serves: { current: hydrationGlasses, target: targets.dailyHydrationGlasses },
    progress,
    status: pillarStatus(progress),
    tip:
      progress >= 0.85
        ? "Hydration is on track today"
        : "Keep sipping throughout the afternoon",
  };
}

export function buildHydrationPillarFromGlasses(
  glasses: number,
  dailyHydrationGlasses: number = DEFAULT_DAILY_HYDRATION_GLASSES,
): PillarProgress {
  return buildHydrationPillar(glasses, {
    ...defaultExtendedNutritionTargets(),
    dailyHydrationGlasses,
  });
}

export function buildEnergyMetrics(totals: DailyTotals): {
  carbs: EnergyMetric;
  fats: EnergyMetric;
} {
  const carbsStatus: PillarStatus =
    totals.carbs >= 80 && totals.carbs <= 220 ? "good" : totals.carbs < 80 ? "low" : "moderate";
  const fatStatus: PillarStatus =
    totals.fat >= 35 && totals.fat <= 90 ? "good" : totals.fat < 35 ? "low" : "moderate";

  return {
    carbs: {
      icon: "carbs",
      label: "Carbs",
      grams: Math.round(totals.carbs),
      status: carbsStatus,
      description: "Energy source for brain and exercise",
      equivalents: formatMacroEquivalents(totals.carbs, "carbs"),
    },
    fats: {
      icon: "fat",
      label: "Healthy Fats",
      grams: Math.round(totals.fat),
      status: fatStatus,
      description: "Supports hormones, fullness and nutrient absorption",
      equivalents: formatMacroEquivalents(totals.fat, "fat"),
    },
  };
}

export function buildGutHealthSummary(classification: FoodClassification): {
  fermentedFoods: string[];
  prebioticFoods: string[];
  score: number;
  status: PillarStatus;
} {
  const progress = gutHealthProgress(classification);
  const score = Math.round(progress * 10);

  return {
    fermentedFoods: classification.fermented,
    prebioticFoods: classification.prebiotic,
    score,
    status: pillarStatus(progress),
  };
}
