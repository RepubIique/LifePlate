import type { MealGuardrailCode, MealAnalysisResult } from "@lifeplate/shared";

export const MIN_MEAL_CONFIDENCE = 0.35;
export const MAX_REASONABLE_CALORIES = 5000;

export class MealGuardrailError extends Error {
  code: MealGuardrailCode;
  status: number;

  constructor(code: MealGuardrailCode, message: string, status: number) {
    super(message);
    this.name = "MealGuardrailError";
    this.code = code;
    this.status = status;
  }
}

export function assertMealAnalysis(analysis: MealAnalysisResult): void {
  const foods = analysis.foods.map((f) => f.trim()).filter(Boolean);
  if (foods.length === 0) {
    throw new MealGuardrailError(
      "UNCLEAR_PHOTO",
      "We couldn't identify any food in this photo. Try a clearer shot of your meal.",
      422,
    );
  }

  if (analysis.confidence < MIN_MEAL_CONFIDENCE) {
    throw new MealGuardrailError(
      "UNCLEAR_PHOTO",
      "We couldn't see the food clearly. Try brighter light or move closer.",
      422,
    );
  }

  if (analysis.estimatedCalories > MAX_REASONABLE_CALORIES) {
    throw new MealGuardrailError(
      "UNCLEAR_PHOTO",
      "This photo doesn't look like a typical meal. Try again with your plate in frame.",
      422,
    );
  }
}

export function rejectNonMealPhoto(rejectReason?: string | null): never {
  const detail = rejectReason?.trim();
  const message = detail
    ? `This doesn't look like a meal photo (${detail}). Try again with food on the plate.`
    : "This doesn't look like a meal photo. Try again with food on the plate.";

  throw new MealGuardrailError("NOT_FOOD", message, 422);
}
