export interface BodyMetrics {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
}

export interface NutritionTargets {
  dailyFibreG: number;
  dailyCalories: number;
}

/** Fallback when body metrics are not set. */
export const DEFAULT_DAILY_FIBRE_G = 30;

/** Mifflin–St Jeor BMR averaged across sexes, lightly active (×1.375). */
export function estimateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  const tdee = bmr * 1.375;
  return Math.round(Math.max(1200, Math.min(4000, tdee)));
}

/** 14 g per 1000 kcal, with a body-weight floor (0.4 g/kg), capped at 40 g. */
export function computeDailyFibreTarget(
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const calories = estimateDailyCalories(weightKg, heightCm, age);
  const fromCalories = Math.round(14 * (calories / 1000));
  const fromWeight = Math.round(weightKg * 0.4);
  return Math.min(40, Math.max(fromCalories, fromWeight, 25));
}

export function computeNutritionTargets(
  metrics: BodyMetrics,
): NutritionTargets | null {
  const { weightKg, heightCm, age } = metrics;
  if (
    weightKg == null ||
    heightCm == null ||
    age == null ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    age <= 0 ||
    age > 120
  ) {
    return null;
  }

  const dailyCalories = estimateDailyCalories(weightKg, heightCm, age);
  const dailyFibreG = computeDailyFibreTarget(weightKg, heightCm, age);
  return { dailyFibreG, dailyCalories };
}

export function resolveDailyFibreGoal(metrics: BodyMetrics): number {
  return computeNutritionTargets(metrics)?.dailyFibreG ?? DEFAULT_DAILY_FIBRE_G;
}
