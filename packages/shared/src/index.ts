export interface BodyMetrics {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
}

export interface NutritionTargets {
  dailyFibreG: number;
  dailyCalories: number;
  dailyProteinG: number;
  dailyPlantServes: number;
  dailyHydrationGlasses: number;
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
export const DEFAULT_DAILY_PROTEIN_G = 60;
export const DEFAULT_DAILY_PLANT_SERVES = 7;
export const DEFAULT_DAILY_HYDRATION_GLASSES = 8;

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
  goal: string | null = null,
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
  const normalizedGoal = (goal ?? "").toLowerCase();
  const gramsPerKg =
    normalizedGoal.includes("protein") || normalizedGoal.includes("weight")
      ? 1.6
      : 1.2;
  const dailyProteinG = Math.round(
    Math.max(45, Math.min(160, weightKg * gramsPerKg)),
  );

  return {
    dailyFibreG,
    dailyCalories,
    dailyProteinG,
    dailyPlantServes: DEFAULT_DAILY_PLANT_SERVES,
    dailyHydrationGlasses: DEFAULT_DAILY_HYDRATION_GLASSES,
  };
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

export const MEAL_GUARDRAIL_CODES = [
  "INVALID_IMAGE",
  "NOT_FOOD",
  "UNCLEAR_PHOTO",
  "RATE_LIMITED",
] as const;

export type MealGuardrailCode = (typeof MEAL_GUARDRAIL_CODES)[number];

export interface MealMacroTotals {
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
}

export interface MealAnalysisResult extends MealMacroTotals {
  mealName: string;
  foods: string[];
  confidence: number;
  /** AI estimate of how many portions are visible in the photo (≥ 1). */
  estimatedServings?: number;
}

/** True when the photo likely shows more food than one person would eat. */
export function isLikelySharedMeal(
  analysis: Pick<MealAnalysisResult, "estimatedCalories" | "estimatedServings">,
  dailyCalories?: number | null,
): boolean {
  const servings = analysis.estimatedServings;
  if (servings != null && servings >= 2) return true;
  const threshold = dailyCalories
    ? Math.round(dailyCalories * 0.55)
    : 900;
  return analysis.estimatedCalories >= threshold;
}

export function clampMealPortions(value: number, min = 1, max = 12): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Scale total photo macros to what the user actually ate. */
export function scaleMealForPortions(
  macros: MealMacroTotals,
  totalServings: number,
  portionsEaten = 1,
): MealMacroTotals {
  const servings = clampMealPortions(totalServings);
  const eaten = clampMealPortions(portionsEaten, 1, servings);
  const factor = eaten / servings;
  return {
    estimatedCalories: Math.round(macros.estimatedCalories * factor),
    protein: Math.round(macros.protein * factor),
    carbs: Math.round(macros.carbs * factor),
    fat: Math.round(macros.fat * factor),
    fibre: Math.round(macros.fibre * factor),
    sugar: Math.round(macros.sugar * factor),
    sodium: Math.round(macros.sodium * factor),
  };
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
  /** ISO timestamp — log the meal on a prior day. */
  loggedAt?: string;
}

export interface MealListSummary {
  id: string;
  mealType: string | null;
  mealName: string;
  imageUrl: string;
  createdAt: string;
  calories?: number | null;
  protein?: number | null;
}

export interface MealListItem extends MealListSummary {
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
  /** ISO timestamp — move the meal to another day. */
  loggedAt?: string;
}

export interface HydrationDayRecord {
  date: string;
  glasses: number;
}

export interface HydrationHistoryResponse {
  days: HydrationDayRecord[];
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

export type {
  NutritionDashboardResponse,
  NutritionDashboardApiResponse,
  DashboardTodaySummary,
  MealPatchResponse,
  PillarProgress,
  EnergyMetric,
  GutHealthSummary,
  FoodRecommendation,
  RecommendationImpact,
  NutritionIconKey,
  WeeklyTrendItem,
  HydrationSummary,
  ComparisonPeriod,
  ComparisonPillarMetrics,
  PeriodSnapshot,
  PeriodComparison,
  ScoreStatus,
  PillarStatus,
  TrendStatus,
  DailyTotals,
  ExtendedNutritionTargets,
  FoodClassification,
  NutritionGaps,
} from "./nutrition/index.js";

export {
  classifyFoods,
  countProcessedMeals,
  formatMacroEquivalents,
  stillNeededForMacro,
  computeDailyProteinTarget,
  buildExtendedNutritionTargets,
  defaultExtendedNutritionTargets,
  computeNutritionGaps,
  computeNutritionScore,
  scoreStatus,
  scoreStatusEmoji,
  buildProteinPillar,
  buildFibrePillar,
  buildPlantsPillar,
  buildHydrationPillar,
  buildHydrationPillarFromGlasses,
  buildEnergyMetrics,
  buildGutHealthSummary,
  buildFoodRecommendations,
  buildCoachSummary,
  buildLifeplateInsightTemplate,
  buildWeeklyTrends,
  weeklyGutScore,
  buildComparisonPillars,
  buildPeriodSnapshot,
  buildDayComparison,
  scoreDelta,
  buildComparisonSummary,
  formatScoreDelta,
  pillarDelta,
  COMPARISON_PERIODS,
} from "./nutrition/index.js";

export {
  MAX_LOG_PAST_DAYS,
  todayDateKey,
  dateKeyFromIso,
  isValidLogDateKey,
  loggedAtForDateKey,
  recentLogDateKeys,
  formatLogDateLabel,
} from "./logDate.js";

/** Fields returned from PATCH /api/users/me — only what was edited. */
export interface ProfilePatchResponse {
  name?: string | null;
  goal?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: Gender | null;
  avatarUrl?: string | null;
  nutritionTargets?: NutritionTargets | null;
}

export interface AlphaFeedbackMessage {
  id: string;
  userId: string;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface AlphaFeedbackMessagesResponse {
  messages: AlphaFeedbackMessage[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  goal: string | null;
  avatarUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
  nutritionTargets: NutritionTargets | null;
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
}
