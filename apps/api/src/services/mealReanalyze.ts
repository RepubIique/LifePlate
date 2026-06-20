import {
  MAX_MEAL_REANALYZES,
  mealReanalyzeRemaining,
  type MealAnalysisResult,
} from "@lifeplate/shared";
import { MealGuardrailError } from "./mealGuardrails.js";

export function assertMealReanalyzeAllowed(reanalyzeCount: number): void {
  if (reanalyzeCount >= MAX_MEAL_REANALYZES) {
    throw new MealGuardrailError(
      "REANALYZE_LIMIT",
      `You've used all ${MAX_MEAL_REANALYZES} AI re-analyses for this meal.`,
      429,
    );
  }
}

export function nextMealReanalyzeRemaining(reanalyzeCount: number): number {
  return mealReanalyzeRemaining(reanalyzeCount + 1);
}

export function analysisToMealFields(analysis: MealAnalysisResult) {
  return {
    mealName: analysis.mealName,
    foods: analysis.foods,
    calories: analysis.estimatedCalories,
    protein: analysis.protein,
    carbs: analysis.carbs,
    fat: analysis.fat,
    fibre: analysis.fibre,
    sugar: analysis.sugar,
    sodium: analysis.sodium,
    confidence: analysis.confidence,
  };
}
