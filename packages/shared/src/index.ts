export interface BodyMetrics {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
}

export interface NutritionTargets {
  dailyFibreG: number;
  dailyCalories: number;
}

export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "unspecified", label: "Prefer not to say" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

export function genderLabel(gender: Gender | null | undefined): string {
  if (!gender) return "Not set";
  return GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender;
}

/** Fallback when body metrics are not set. */
export const DEFAULT_DAILY_FIBRE_G = 30;

/** Mifflin–St Jeor BMR, lightly active (×1.375). */
export function estimateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = base + sexOffset;
  const tdee = bmr * 1.375;
  return Math.round(Math.max(1200, Math.min(4000, tdee)));
}

/** 14 g per 1000 kcal, with a body-weight floor (0.4 g/kg), capped at 40 g. */
export function computeDailyFibreTarget(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const calories = estimateDailyCalories(weightKg, heightCm, age, gender);
  const fromCalories = Math.round(14 * (calories / 1000));
  const fromWeight = Math.round(weightKg * 0.4);
  return Math.min(40, Math.max(fromCalories, fromWeight, 25));
}

export function computeNutritionTargets(
  metrics: BodyMetrics,
): NutritionTargets | null {
  const { weightKg, heightCm, age, gender } = metrics;
  if (
    weightKg == null ||
    heightCm == null ||
    age == null ||
    gender == null ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    age <= 0 ||
    age > 120
  ) {
    return null;
  }

  const dailyCalories = estimateDailyCalories(weightKg, heightCm, age, gender);
  const dailyFibreG = computeDailyFibreTarget(weightKg, heightCm, age, gender);
  return { dailyFibreG, dailyCalories };
}

export function hasBodyMetrics(metrics: BodyMetrics): boolean {
  return computeNutritionTargets(metrics) != null;
}

export function isOnboardingComplete(profile: {
  goal: string | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
}): boolean {
  return (
    !!profile.goal?.trim() &&
    hasBodyMetrics({
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      gender: profile.gender,
    })
  );
}

export function resolveDailyFibreGoal(metrics: BodyMetrics): number {
  return computeNutritionTargets(metrics)?.dailyFibreG ?? DEFAULT_DAILY_FIBRE_G;
}

export const GOALS = [
  "Better health",
  "Weight management",
  "Increase protein",
  "Improve nutrition awareness",
  "Track symptoms",
  "General wellbeing",
] as const;

export type UserGoal = (typeof GOALS)[number];

export const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "beverage", label: "Beverage" },
  { value: "dessert", label: "Dessert" },
] as const;

export type MealType = (typeof MEAL_TYPE_OPTIONS)[number]["value"];

export function isMealType(value: string): value is MealType {
  return MEAL_TYPE_OPTIONS.some((o) => o.value === value);
}

/** Infer meal category from local time (device or provided date). */
export function inferMealType(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
}

export function mealTypeLabel(mealType: MealType | string | null | undefined): string {
  if (!mealType) return "Meal";
  return MEAL_TYPE_OPTIONS.find((o) => o.value === mealType)?.label ?? mealType;
}

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
  gender: Gender | null;
  nutritionTargets: NutritionTargets | null;
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
}
