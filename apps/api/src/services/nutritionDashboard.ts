import {
  buildCoachSummary,
  buildDayComparison,
  buildExtendedNutritionTargets,
  buildFoodRecommendations,
  buildPeriodSnapshot,
  buildWeeklyTrends,
  classifyFoods,
  computeNutritionGaps,
  computeNutritionScore,
  countProcessedMeals,
  defaultExtendedNutritionTargets,
  isValidLogDateKey,
  scoreStatus,
  type DailyTotals,
  type ExtendedNutritionTargets,
  type NutritionDashboardApiResponse,
  weeklyGutScore,
} from "@lifeplate/shared";
import type { Gender } from "@lifeplate/shared";
import { computeNutritionTargets } from "@lifeplate/shared";
import { generateLifeplateInsight, normalizeLifeplateInsight } from "./coaching.js";
import {
  getCachedDailyInsight,
  saveDailyInsight,
} from "./dailyInsightCache.js";
import { todayDateKey } from "./streaks.js";
import { pool } from "../db.js";

type MealRow = {
  meal_id: string;
  meal_name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
  food_name: string | null;
  created_at: Date;
};

type UserRow = {
  goal: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  age: number | null;
  gender: string | null;
};

function parseGender(value: string | null): Gender | null {
  if (value === "female" || value === "male" || value === "unspecified") {
    return value;
  }
  return null;
}

function resolveTargets(user: UserRow): ExtendedNutritionTargets {
  const weightKg = user.weight_kg != null ? Number(user.weight_kg) : null;
  const heightCm = user.height_cm != null ? Number(user.height_cm) : null;
  const age = user.age;
  const gender = parseGender(user.gender);

  const base = computeNutritionTargets(
    { weightKg, heightCm, age, gender },
    user.goal,
  );

  if (!base || weightKg == null) {
    return defaultExtendedNutritionTargets();
  }

  return buildExtendedNutritionTargets(
    weightKg,
    user.goal,
    base.dailyCalories,
    base.dailyFibreG,
  );
}

function aggregateTotals(rows: MealRow[]): DailyTotals {
  const mealIds = new Set<string>();
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fibre = 0;

  const seenMealMacros = new Set<string>();

  for (const row of rows) {
    mealIds.add(row.meal_id);
    if (seenMealMacros.has(row.meal_id)) continue;
    seenMealMacros.add(row.meal_id);
    calories += Number(row.calories ?? 0);
    protein += Number(row.protein ?? 0);
    carbs += Number(row.carbs ?? 0);
    fat += Number(row.fat ?? 0);
    fibre += Number(row.fibre ?? 0);
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fibre: Math.round(fibre),
    mealsCount: mealIds.size,
  };
}

function collectFoods(rows: MealRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => row.food_name?.trim())
        .filter((food): food is string => !!food),
    ),
  ];
}

function collectMealNames(rows: MealRow[]): string[] {
  return [...new Set(rows.map((row) => row.meal_name))];
}

async function fetchMealRowsSince(userId: string, since: Date): Promise<MealRow[]> {
  const { rows } = await pool.query<MealRow>(
    `SELECT m.id AS meal_id, m.meal_name, m.created_at,
            a.calories, a.protein, a.carbs, a.fat, a.fibre,
            f.food_name
     FROM meals m
     LEFT JOIN meal_analysis a ON a.meal_id = m.id
     LEFT JOIN foods f ON f.meal_id = m.id
     WHERE m.user_id = $1 AND m.created_at >= $2`,
    [userId, since],
  );

  return rows;
}

async function fetchHydrationGlasses(userId: string, dateKey?: string): Promise<number> {
  const { rows } = await pool.query<{ glasses: number }>(
    `SELECT glasses FROM daily_hydration
     WHERE user_id = $1 AND log_date = COALESCE($2::date, CURRENT_DATE)`,
    [userId, dateKey ?? null],
  );
  return rows[0]?.glasses ?? 0;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow(): Date {
  const today = startOfToday();
  today.setDate(today.getDate() + 1);
  return today;
}

function yesterdayDateKey(): string {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function filterRowsForDate(rows: MealRow[], dateKey: string): MealRow[] {
  return rows.filter((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    return key === dateKey;
  });
}

function startOfWeek(): Date {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return now;
}

function filterTodayRows(weekRows: MealRow[]): MealRow[] {
  const todayStart = startOfToday();
  const todayEnd = startOfTomorrow();
  return weekRows.filter((row) => {
    const created = new Date(row.created_at);
    return created >= todayStart && created < todayEnd;
  });
}

function computeWeeklyMetricsFromRows(weekRows: MealRow[]): {
  avgDailyProtein: number;
  avgPlantFoods: number;
  gutScore: number;
  processedPercent: number;
  omega3Days: number;
  daysWithMeals: number;
} {
  const dayMap = new Map<string, MealRow[]>();

  for (const row of weekRows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const list = dayMap.get(key) ?? [];
    list.push(row);
    dayMap.set(key, list);
  }

  const daysWithMeals = dayMap.size;
  let proteinTotal = 0;
  let plantTotal = 0;
  let omega3Days = 0;
  let gutScoreTotal = 0;

  const processedMealRows: Array<{ mealName: string; foods: string[] }> = [];

  for (const [, dayRows] of dayMap) {
    const totals = aggregateTotals(dayRows);
    proteinTotal += totals.protein;
    const foods = collectFoods(dayRows);
    const classification = classifyFoods(foods, collectMealNames(dayRows));
    plantTotal += classification.plants.length;
    gutScoreTotal += weeklyGutScore(classification);
    if (classification.omega3.length > 0) omega3Days += 1;

    const mealFoodMap = new Map<string, string[]>();
    for (const row of dayRows) {
      const foodsForMeal = mealFoodMap.get(row.meal_name) ?? [];
      if (row.food_name) foodsForMeal.push(row.food_name);
      mealFoodMap.set(row.meal_name, foodsForMeal);
    }
    for (const [mealName, foods] of mealFoodMap) {
      processedMealRows.push({ mealName, foods });
    }
  }

  const processedCount = countProcessedMeals(processedMealRows);
  const totalMeals = new Set(weekRows.map((row) => row.meal_id)).size;
  const processedPercent =
    totalMeals > 0 ? Math.round((processedCount / totalMeals) * 100) : 0;

  return {
    avgDailyProtein:
      daysWithMeals > 0 ? Math.round(proteinTotal / daysWithMeals) : 0,
    avgPlantFoods:
      daysWithMeals > 0 ? Math.round(plantTotal / daysWithMeals) : 0,
    gutScore:
      daysWithMeals > 0 ? Math.round(gutScoreTotal / daysWithMeals) : 0,
    processedPercent,
    omega3Days,
    daysWithMeals,
  };
}

export async function buildNutritionDashboard(
  userId: string,
): Promise<NutritionDashboardApiResponse> {
  const dateKey = todayDateKey();

  const [{ rows: userRows }, weekRows, hydrationGlasses, yesterdayHydrationGlasses, cachedInsight] = await Promise.all([
    pool.query<UserRow>(
      `SELECT goal, weight_kg, height_cm, age, gender FROM users WHERE id = $1`,
      [userId],
    ),
    fetchMealRowsSince(userId, startOfWeek()),
    fetchHydrationGlasses(userId),
    fetchHydrationGlasses(userId, yesterdayDateKey()),
    getCachedDailyInsight(userId, dateKey),
  ]);

  const user = userRows[0];
  const targets = resolveTargets(
    user ?? {
      goal: null,
      weight_kg: null,
      height_cm: null,
      age: null,
      gender: null,
    },
  );

  const todayRows = filterTodayRows(weekRows);
  const yesterdayRows = filterRowsForDate(weekRows, yesterdayDateKey());
  const totals = aggregateTotals(todayRows);
  const yesterdayTotals = aggregateTotals(yesterdayRows);
  const foods = collectFoods(todayRows);
  const yesterdayFoods = collectFoods(yesterdayRows);
  const mealNames = collectMealNames(todayRows);
  const yesterdayMealNames = collectMealNames(yesterdayRows);
  const classification = classifyFoods(foods, mealNames);
  const yesterdayClassification = classifyFoods(yesterdayFoods, yesterdayMealNames);

  const gaps = computeNutritionGaps(totals, targets, classification, hydrationGlasses);
  const score = computeNutritionScore(
    totals,
    targets,
    classification,
    hydrationGlasses,
  );
  const status = scoreStatus(score);
  const coachSummary = buildCoachSummary(gaps, score);
  const recommendations = buildFoodRecommendations(gaps);
  const weeklyMetrics = computeWeeklyMetricsFromRows(weekRows);

  const currentSnapshot = buildPeriodSnapshot(
    "Today",
    dateKey,
    totals,
    classification,
    hydrationGlasses,
    targets,
  );
  const previousSnapshot = buildPeriodSnapshot(
    "Yesterday",
    yesterdayDateKey(),
    yesterdayTotals,
    yesterdayClassification,
    yesterdayHydrationGlasses,
    targets,
  );
  const comparison = buildDayComparison(currentSnapshot, previousSnapshot);

  let lifeplateInsight = cachedInsight;
  if (!lifeplateInsight) {
    lifeplateInsight = await generateLifeplateInsight({
      goal: user?.goal ?? null,
      totals,
      targets,
      plantCount: classification.plants.length,
      recentFoods: foods.slice(0, 12),
      score,
    });
    await saveDailyInsight(userId, lifeplateInsight, dateKey);
  }

  return {
    date: dateKey,
    score,
    scoreStatus: status,
    coachSummary,
    today: {
      totals,
      plants: classification.plants,
      fermented: classification.fermented,
      prebiotic: classification.prebiotic,
    },
    hydration: { glasses: hydrationGlasses },
    recommendations,
    weeklyTrends: buildWeeklyTrends({
      avgDailyProtein: weeklyMetrics.avgDailyProtein,
      proteinTarget: targets.dailyProteinG,
      avgPlantFoods: weeklyMetrics.avgPlantFoods,
      plantTarget: targets.dailyPlantServes,
      gutScore: weeklyMetrics.gutScore,
      processedPercent: weeklyMetrics.processedPercent,
      omega3Days: weeklyMetrics.omega3Days,
      daysWithMeals: weeklyMetrics.daysWithMeals,
    }),
    lifeplateInsight: normalizeLifeplateInsight(lifeplateInsight),
    comparison,
  };
}

export async function updateHydrationGlasses(
  userId: string,
  glasses: number,
  logDate?: string,
): Promise<{ glasses: number; date: string }> {
  const dateKey = logDate ?? todayDateKey();
  if (!isValidLogDateKey(dateKey)) {
    throw new Error("Invalid log date");
  }
  const clamped = Math.max(0, Math.min(24, Math.round(glasses)));

  await pool.query(
    `INSERT INTO daily_hydration (user_id, log_date, glasses)
     VALUES ($1, $2::date, $3)
     ON CONFLICT (user_id, log_date)
     DO UPDATE SET glasses = EXCLUDED.glasses`,
    [userId, dateKey, clamped],
  );

  return { glasses: clamped, date: dateKey };
}

export async function fetchHydrationHistory(
  userId: string,
  days = 60,
): Promise<Array<{ date: string; glasses: number }>> {
  const span = Math.max(1, Math.min(90, Math.round(days)));
  const { rows } = await pool.query<{ date: string; glasses: number }>(
    `SELECT log_date::text AS date, glasses
     FROM daily_hydration
     WHERE user_id = $1
       AND log_date >= CURRENT_DATE - ($2::int - 1)
     ORDER BY log_date DESC`,
    [userId, span],
  );
  return rows;
}
