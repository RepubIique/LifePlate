import type { ExtendedNutritionTargets } from "./types.js";
import {
  DEFAULT_DAILY_HYDRATION_GLASSES,
  DEFAULT_DAILY_PLANT_SERVES,
  DEFAULT_DAILY_PROTEIN_G,
} from "./types.js";

export function computeDailyProteinTarget(
  weightKg: number,
  goal: string | null = null,
): number {
  const normalizedGoal = (goal ?? "").toLowerCase();
  let gramsPerKg = 1.2;
  if (
    normalizedGoal.includes("protein") ||
    normalizedGoal.includes("weight") ||
    normalizedGoal.includes("muscle")
  ) {
    gramsPerKg = 1.6;
  }
  return Math.round(Math.max(45, Math.min(160, weightKg * gramsPerKg)));
}

export function buildExtendedNutritionTargets(
  weightKg: number,
  goal: string | null,
  dailyCalories: number,
  dailyFibreG: number,
): ExtendedNutritionTargets {
  return {
    dailyCalories,
    dailyFibreG,
    dailyProteinG: computeDailyProteinTarget(weightKg, goal),
    dailyPlantServes: DEFAULT_DAILY_PLANT_SERVES,
    dailyHydrationGlasses: DEFAULT_DAILY_HYDRATION_GLASSES,
  };
}

export function defaultExtendedNutritionTargets(): ExtendedNutritionTargets {
  return {
    dailyCalories: 2000,
    dailyFibreG: 30,
    dailyProteinG: DEFAULT_DAILY_PROTEIN_G,
    dailyPlantServes: DEFAULT_DAILY_PLANT_SERVES,
    dailyHydrationGlasses: DEFAULT_DAILY_HYDRATION_GLASSES,
  };
}
