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
  "REANALYZE_LIMIT",
] as const;

/** Per-meal cap on AI macro re-estimates from the edit screen. */
export const MAX_MEAL_REANALYZES = 2;

export function mealReanalyzeRemaining(reanalyzeCount: number): number {
  return Math.max(0, MAX_MEAL_REANALYZES - Math.max(0, reanalyzeCount));
}

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

/** Round macro totals to whole numbers for integer DB columns. */
export function roundMealMacroTotals<T extends MealMacroTotals>(macros: T): T {
  return {
    ...macros,
    estimatedCalories: Math.round(macros.estimatedCalories),
    protein: Math.round(macros.protein),
    carbs: Math.round(macros.carbs),
    fat: Math.round(macros.fat),
    fibre: Math.round(macros.fibre),
    sugar: Math.round(macros.sugar),
    sodium: Math.round(macros.sodium),
  };
}

export function roundOptionalMealMacro(value: number | null | undefined): number | null | undefined {
  if (value == null) return value;
  return Math.round(value);
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

export interface MealPortionMeta {
  totalPortions: number;
  portionsEaten: number;
  baseMacros: MealMacroTotals;
  estimatedServings?: number;
}

export function mealListItemToMacros(
  meal: Pick<
    MealListItem,
    "calories" | "protein" | "carbs" | "fat" | "fibre" | "sugar" | "sodium"
  >,
): MealMacroTotals {
  return {
    estimatedCalories: meal.calories ?? 0,
    protein: meal.protein ?? 0,
    carbs: meal.carbs ?? 0,
    fat: meal.fat ?? 0,
    fibre: meal.fibre ?? 0,
    sugar: meal.sugar ?? 0,
    sodium: meal.sodium ?? 0,
  };
}

function isMealMacroTotals(value: unknown): value is MealMacroTotals {
  if (!value || typeof value !== "object") return false;
  const v = value as MealMacroTotals;
  return (
    typeof v.estimatedCalories === "number" &&
    typeof v.protein === "number" &&
    typeof v.carbs === "number" &&
    typeof v.fat === "number" &&
    typeof v.fibre === "number" &&
    typeof v.sugar === "number" &&
    typeof v.sodium === "number"
  );
}

export function parseMealPortionMeta(raw: unknown): MealPortionMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const portionMeta = (raw as { portionMeta?: unknown }).portionMeta;
  if (!portionMeta || typeof portionMeta !== "object") return undefined;

  const meta = portionMeta as MealPortionMeta;
  if (
    typeof meta.totalPortions !== "number" ||
    typeof meta.portionsEaten !== "number" ||
    !isMealMacroTotals(meta.baseMacros)
  ) {
    return undefined;
  }

  return {
    totalPortions: clampMealPortions(meta.totalPortions),
    portionsEaten: clampMealPortions(meta.portionsEaten, 1, meta.totalPortions),
    baseMacros: meta.baseMacros,
    estimatedServings: meta.estimatedServings,
  };
}

export function resolveMealPortionState(
  stored: MealMacroTotals,
  portionMeta?: MealPortionMeta | null,
): {
  baseMacros: MealMacroTotals;
  totalPortions: number;
  portionsEaten: number;
  estimatedServings?: number;
} {
  if (portionMeta) {
    return {
      baseMacros: portionMeta.baseMacros,
      totalPortions: portionMeta.totalPortions,
      portionsEaten: portionMeta.portionsEaten,
      estimatedServings: portionMeta.estimatedServings,
    };
  }

  return {
    baseMacros: stored,
    totalPortions: 1,
    portionsEaten: 1,
  };
}

export function buildMealPortionMeta(
  baseMacros: MealMacroTotals,
  totalPortions: number,
  portionsEaten: number,
  estimatedServings?: number,
): MealPortionMeta | undefined {
  const total = clampMealPortions(totalPortions);
  if (total <= 1) return undefined;

  return {
    totalPortions: total,
    portionsEaten: clampMealPortions(portionsEaten, 1, total),
    baseMacros,
    estimatedServings,
  };
}

export interface MealUploadResponse extends MealAnalysisResult {
  draftId: string;
  /** Cloud URL when paid cloud backup is enabled; empty when photos stay on device. */
  imageUrl: string;
  coachNudge: string;
}

export interface MealPhotoAttachResponse {
  /** Cloud URL when paid cloud backup is enabled; empty when photos stay on device. */
  imageUrl: string;
}

export interface MealConfirmResponse {
  id: string;
}

/** Paid users who opted in — meal photos are also stored in cloud storage. */
export function hasCloudMealImageBackup(profile: {
  isPaid: boolean;
  cloudImageBackup: boolean;
}): boolean {
  return profile.isPaid && profile.cloudImageBackup;
}

export interface MealTextLogRequest {
  /** What the user ate, e.g. "chicken rice bowl with broccoli". */
  description: string;
}

export interface MealRefineRequest {
  draftId: string;
  clarification: string;
}

export interface MealRefineResponse extends MealAnalysisResult {
  coachNudge: string;
}

export interface MealReanalyzeRequest {
  foods: string[];
  mealName?: string;
  mealType?: MealType | null;
}

export interface MealReanalyzeResponse extends MealAnalysisResult {
  reanalyzeRemaining: number;
}

export interface MealConfirmRequest {
  draftId: string;
  /** Cloud URL only — omit or leave empty for device-only photos. */
  imageUrl?: string;
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
  portionMeta?: MealPortionMeta;
}

export const MAX_MEAL_NOTES_LENGTH = 500;

export function normalizeMealNotes(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_MEAL_NOTES_LENGTH);
}

export interface MealListSummary {
  id: string;
  mealType: string | null;
  mealName: string;
  imageUrl: string;
  createdAt: string;
  /** Calendar day the meal was logged for (YYYY-MM-DD). */
  logDate: string;
  /** Within-day timeline order; 0 = top slot. */
  sortIndex: number;
  calories?: number | null;
  protein?: number | null;
  notes?: string | null;
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
  portionMeta?: MealPortionMeta;
  reanalyzeCount: number;
  reanalyzeRemaining: number;
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
  /** Free-form journal note (who you ate with, recipe, etc.). */
  notes?: string | null;
  portionMeta?: MealPortionMeta | null;
}

export interface MealReorderRequest {
  dateKey: string;
  mealIds: string[];
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
  PlantUnit,
} from "./nutrition/index.js";

export {
  classifyFoods,
  countProcessedMeals,
  plantLabelsForFood,
  proteinLabelsForFood,
  fibreLabelsForFood,
  carbsLabelsForFood,
  resolvedPlantServes,
  formatPlantAmount,
  formatPlantFoodText,
  parsePlantFoodText,
  PLANT_AMOUNT_PRESETS,
  PLANT_UNIT_OPTIONS,
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
  buildCarbsPillar,
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
  applyMealSortIndices,
  compareMealsTimeline,
  mealLogDateKey,
  recentLogDateKeys,
  formatLogDateLabel,
  offsetLogDateKey,
  type MealTimelineFields,
} from "./logDate.js";

/** Fields returned from PATCH /api/users/me — only what was edited. */
export interface ProfilePatchResponse {
  name?: string | null;
  goal?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: Gender | null;
  hasAvatar?: boolean;
  nutritionTargets?: NutritionTargets | null;
  isPaid?: boolean;
  cloudImageBackup?: boolean;
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

export interface ProfileAvatarResponse {
  avatarUrl: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  goal: string | null;
  hasAvatar: boolean;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  gender: Gender | null;
  nutritionTargets: NutritionTargets | null;
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
  /** Subscription entitlement — unlocks cloud photo backup. */
  isPaid: boolean;
  /** When true (and isPaid), new meal photos are copied to cloud storage. */
  cloudImageBackup: boolean;
}
