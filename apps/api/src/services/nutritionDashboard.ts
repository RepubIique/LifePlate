import {
  buildCoachSummary,
  buildEnergyMetrics,
  buildExtendedNutritionTargets,
  buildFibrePillar,
  buildFoodRecommendations,
  buildGutHealthSummary,
  buildHydrationPillar,
  buildPlantsPillar,
  buildProteinPillar,
  buildWeeklyTrends,
  classifyFoods,
  computeNutritionGaps,
  computeNutritionScore,
  countProcessedMeals,
  defaultExtendedNutritionTargets,
  scoreStatus,
  type DailyTotals,
  type ExtendedNutritionTargets,
  type NutritionDashboardResponse,
  type PillarProgress,
  weeklyGutScore,
} from "@lifeplate/shared";
import type { Gender } from "@lifeplate/shared";
import { computeNutritionTargets } from "@lifeplate/shared";
import { generateLifeplateInsight } from "./coaching.js";
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

async function fetchMealRows(
  userId: string,
  since: Date,
  until?: Date,
): Promise<MealRow[]> {
  const params: unknown[] = [userId, since];
  let dateClause = "m.created_at >= $2";
  if (until) {
    params.push(until);
    dateClause += " AND m.created_at < $3";
  }

  const { rows } = await pool.query<MealRow>(
    `SELECT m.id AS meal_id, m.meal_name, m.created_at,
            a.calories, a.protein, a.carbs, a.fat, a.fibre,
            f.food_name
     FROM meals m
     LEFT JOIN meal_analysis a ON a.meal_id = m.id
     LEFT JOIN foods f ON f.meal_id = m.id
     WHERE m.user_id = $1 AND ${dateClause}`,
    params,
  );

  return rows;
}

async function fetchHydrationGlasses(userId: string): Promise<number> {
  const { rows } = await pool.query<{ glasses: number }>(
    `SELECT glasses FROM daily_hydration
     WHERE user_id = $1 AND log_date = CURRENT_DATE`,
    [userId],
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

function startOfWeek(): Date {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return now;
}

async function computeWeeklyMetrics(
  userId: string,
  targets: ExtendedNutritionTargets,
): Promise<{
  avgDailyProtein: number;
  avgPlantFoods: number;
  gutScore: number;
  processedPercent: number;
  omega3Days: number;
  daysWithMeals: number;
}> {
  const weekRows = await fetchMealRows(userId, startOfWeek());
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
): Promise<NutritionDashboardResponse> {
  const { rows: userRows } = await pool.query<UserRow>(
    `SELECT goal, weight_kg, height_cm, age, gender FROM users WHERE id = $1`,
    [userId],
  );
  const user = userRows[0];
  const targets = resolveTargets(user ?? { goal: null, weight_kg: null, height_cm: null, age: null, gender: null });

  const todayRows = await fetchMealRows(userId, startOfToday(), startOfTomorrow());
  const totals = aggregateTotals(todayRows);
  const foods = collectFoods(todayRows);
  const mealNames = collectMealNames(todayRows);
  const classification = classifyFoods(foods, mealNames);
  const hydrationGlasses = await fetchHydrationGlasses(userId);

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
  const weeklyMetrics = await computeWeeklyMetrics(userId, targets);

  const lifeplateInsight = await generateLifeplateInsight({
    goal: user?.goal ?? null,
    totals,
    targets,
    plantCount: classification.plants.length,
    recentFoods: foods.slice(0, 12),
    score,
  });

  return {
    date: new Date().toISOString().slice(0, 10),
    score,
    scoreStatus: status,
    coachSummary,
    essentials: {
      protein: buildProteinPillar(totals, targets),
      fibre: buildFibrePillar(totals, targets),
      plants: buildPlantsPillar(classification, targets),
      hydration: buildHydrationPillar(hydrationGlasses, targets),
    },
    energyBalance: buildEnergyMetrics(totals),
    gutHealth: buildGutHealthSummary(classification),
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
    lifeplateInsight,
  };
}

export async function updateHydrationGlasses(
  userId: string,
  glasses: number,
): Promise<PillarProgress> {
  const clamped = Math.max(0, Math.min(24, Math.round(glasses)));

  await pool.query(
    `INSERT INTO daily_hydration (user_id, log_date, glasses)
     VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (user_id, log_date)
     DO UPDATE SET glasses = EXCLUDED.glasses`,
    [userId, clamped],
  );

  const { rows: userRows } = await pool.query<UserRow>(
    `SELECT goal, weight_kg, height_cm, age, gender FROM users WHERE id = $1`,
    [userId],
  );
  const targets = resolveTargets(userRows[0] ?? { goal: null, weight_kg: null, height_cm: null, age: null, gender: null });

  return buildHydrationPillar(clamped, targets);
}
