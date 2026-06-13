export {
  DEFAULT_DAILY_FIBRE_G,
  computeDailyFibreTarget,
  computeNutritionTargets,
  estimateDailyCalories,
  resolveDailyFibreGoal,
} from "./nutritionTargets.js";
export type { BodyMetrics, NutritionTargets } from "./nutritionTargets.js";

import type { NutritionTargets } from "./nutritionTargets.js";

export const GOALS = [
  "Better health",
  "Weight management",
  "Increase protein",
  "Improve nutrition awareness",
  "Track symptoms",
  "General wellbeing",
] as const;

export type UserGoal = (typeof GOALS)[number];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealAnalysisResult {
  mealName: string;
  foods: string[];
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
  confidence: number;
}

export interface MealUploadResponse extends MealAnalysisResult {
  draftId: string;
  imageUrl: string;
  coachNudge: string;
}

export interface MealRefineRequest {
  draftId: string;
  clarification: string;
}

export interface MealRefineResponse extends MealAnalysisResult {
  coachNudge: string;
}

export interface MealConfirmRequest {
  draftId: string;
  imageUrl: string;
  mealName: string;
  foods: string[];
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
  confidence: number;
  mealType?: MealType;
}

export interface MealListItem {
  id: string;
  mealType: string | null;
  mealName: string;
  imageUrl: string;
  createdAt: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
  sugar: number | null;
  sodium: number | null;
  confidence: number | null;
  foods: string[];
}

export interface MealDetail extends MealListItem {
  rawAiResponse?: unknown;
}

export interface MealUpdateRequest {
  mealType?: MealType | null;
  mealName?: string;
  foods?: string[];
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fibre?: number | null;
  sugar?: number | null;
  sodium?: number | null;
}

export interface InsightsResponse {
  period: string;
  mealsLogged: number;
  vegetablesConsumed: number;
  proteinAverage: number;
  mostCommonFood: string | null;
  homeCookedPercent: number;
  takeawayPercent: number;
  coachNudge: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  goal: string | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  nutritionTargets: NutritionTargets | null;
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
}
