export type ComparisonPeriod = "day" | "week" | "month";

export interface ComparisonPillarMetrics {
  protein: number;
  fibre: number;
  plants: number;
  hydration: number;
}

export interface PeriodSnapshot {
  label: string;
  date: string;
  score: number;
  mealsCount: number;
  pillars: ComparisonPillarMetrics;
  hasData: boolean;
}

export interface PeriodComparison {
  period: ComparisonPeriod;
  currentLabel: string;
  previousLabel: string;
  current: PeriodSnapshot;
  previous: PeriodSnapshot;
}

export type PillarStatus = "good" | "moderate" | "low";
export type ScoreStatus = "excellent" | "good" | "needs_work";
export type TrendStatus = "on_track" | "moderate" | "needs_improvement";

/** Semantic icon keys — rendered on mobile via MaterialCommunityIcons. */
export type NutritionIconKey =
  | "apple"
  | "kiwi"
  | "salad"
  | "egg"
  | "legumes"
  | "fish"
  | "broccoli"
  | "pepper"
  | "carrot"
  | "water"
  | "carbs"
  | "fat"
  | "fermented"
  | "prebiotic";

export interface PillarProgress {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  serves?: { current: number; target: number };
  progress: number;
  status: PillarStatus;
  equivalents?: string[];
  stillNeeded?: string[];
  sources?: string[];
  tip?: string;
}

export interface EnergyMetric {
  icon: NutritionIconKey;
  label: string;
  grams: number;
  status: PillarStatus;
  description: string;
  equivalents: string[];
}

export interface GutHealthSummary {
  fermentedFoods: string[];
  prebioticFoods: string[];
  score: number;
  status: PillarStatus;
}

export interface FoodRecommendation {
  icon: NutritionIconKey;
  name: string;
}

export interface RecommendationImpact {
  label: string;
  detail: string;
}

export interface WeeklyTrendItem {
  label: string;
  status: TrendStatus;
}

export interface HydrationSummary {
  glasses: number;
}

/** Fields returned from PATCH /api/meals/:id — only what was edited. */
export interface MealPatchResponse {
  id: string;
  mealType?: string | null;
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

export interface DashboardTodaySummary {
  totals: DailyTotals;
  plants: string[];
  plantServes?: number;
  fermented: string[];
  prebiotic: string[];
}

/** Wire format for GET /api/nutrition/dashboard — client expands to full view. */
export interface NutritionDashboardApiResponse {
  date: string;
  score: number;
  scoreStatus: ScoreStatus;
  coachSummary: string;
  today: DashboardTodaySummary;
  hydration: HydrationSummary;
  recommendations: NutritionDashboardResponse["recommendations"];
  weeklyTrends: WeeklyTrendItem[];
  lifeplateInsight: string;
  comparison: PeriodComparison;
}

export interface NutritionDashboardResponse {
  date: string;
  score: number;
  scoreStatus: ScoreStatus;
  coachSummary: string;
  essentials: {
    protein: PillarProgress;
    fibre: PillarProgress;
    plants: PillarProgress;
    hydration: HydrationSummary;
  };
  energyBalance: {
    carbs: EnergyMetric;
    fats: EnergyMetric;
  };
  gutHealth: GutHealthSummary;
  recommendations: {
    items: FoodRecommendation[];
    impact: RecommendationImpact[];
  };
  weeklyTrends: WeeklyTrendItem[];
  lifeplateInsight: string;
  comparison: PeriodComparison;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  mealsCount: number;
}

export interface ExtendedNutritionTargets {
  dailyCalories: number;
  dailyFibreG: number;
  dailyProteinG: number;
  dailyPlantServes: number;
  dailyHydrationGlasses: number;
}

export const DEFAULT_DAILY_PROTEIN_G = 60;
export const DEFAULT_DAILY_PLANT_SERVES = 7;
export const DEFAULT_DAILY_HYDRATION_GLASSES = 8;
export const DEFAULT_PROTEIN_SERVES = 5;

export interface FoodClassification {
  plants: string[];
  /** Sum of per-entry plant amounts; falls back to unique plant count when unset. */
  plantServes?: number;
  fermented: string[];
  prebiotic: string[];
  omega3: string[];
  processedMealCount: number;
}

export interface NutritionGaps {
  proteinG: number;
  fibreG: number;
  plantServes: number;
  hydrationGlasses: number;
  caloriesGap: number;
}
