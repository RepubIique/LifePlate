export type PillarStatus = "good" | "moderate" | "low";
export type ScoreStatus = "excellent" | "good" | "needs_work";
export type TrendStatus = "on_track" | "moderate" | "needs_improvement";

export interface PillarProgress {
  emoji: string;
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
  emoji: string;
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
  emoji: string;
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

export interface NutritionDashboardResponse {
  date: string;
  score: number;
  scoreStatus: ScoreStatus;
  coachSummary: string;
  essentials: {
    protein: PillarProgress;
    fibre: PillarProgress;
    plants: PillarProgress;
    hydration: PillarProgress;
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
