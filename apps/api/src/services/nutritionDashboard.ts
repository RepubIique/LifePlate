import {
  aggregateDailySnapshots,
  buildCoachSummary,
  buildDayComparison,
  buildMonthComparison,
  buildExtendedNutritionTargets,
  buildFoodRecommendations,
  buildPeriodSnapshot,
  buildWeekComparison,
  buildWeeklyTrends,
  buildCarbsPillar,
  buildFibrePillar,
  buildHydrationPillarFromGlasses,
  buildPlantsPillar,
  buildProteinPillar,
  classifyFoods,
  computeNutritionGaps,
  computeNutritionScore,
  countProcessedMeals,
  defaultExtendedNutritionTargets,
  enumerateLogDateKeys,
  formatLogDateLabel,
  formatMonthLabel,
  isValidLogDateKey,
  monthEndKey,
  monthStartKey,
  offsetLogDateKey,
  previousMonthEndKey,
  previousMonthStartKey,
  scoreStatus,
  type DailyTotals,
  type ExtendedNutritionTargets,
  type NutritionDashboardApiResponse,
  weeklyGutScore,
  todayDateKey,
} from "@lifeplate/shared";
import type { Gender } from "@lifeplate/shared";
import { computeNutritionTargets } from "@lifeplate/shared";
import { generateLifeplateInsight, normalizeLifeplateInsight } from "./coaching.js";
import {
  getCachedDailyInsight,
  saveDailyInsight,
} from "./dailyInsightCache.js";
import { pool } from "../db.js";

type MealRow = {
  meal_id: string;
  meal_name: string;
  meal_type: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
  foods: string[];
  log_date: string;
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
        .flatMap((row) => row.foods ?? [])
        .map((food) => food.trim())
        .filter((food): food is string => !!food),
    ),
  ];
}

function collectMealNames(rows: MealRow[]): string[] {
  return [...new Set(rows.map((row) => row.meal_name))];
}

function collectMealTypes(rows: MealRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => row.meal_type?.trim().toLowerCase())
        .filter((type): type is string => !!type),
    ),
  ];
}

async function fetchMealRowsSince(userId: string, sinceDateKey: string): Promise<MealRow[]> {
  const { rows } = await pool.query<MealRow>(
    `SELECT m.id AS meal_id, m.meal_name, m.meal_type, m.created_at, m.log_date::text AS log_date,
            m.calories, m.protein, m.carbs, m.fat, m.fibre, m.foods
     FROM meals m
     WHERE m.user_id = $1 AND m.log_date >= $2::date`,
    [userId, sinceDateKey],
  );

  return rows;
}

async function fetchMealRowsBetween(
  userId: string,
  startDateKey: string,
  endDateKey: string,
): Promise<MealRow[]> {
  const { rows } = await pool.query<MealRow>(
    `SELECT m.id AS meal_id, m.meal_name, m.meal_type, m.created_at, m.log_date::text AS log_date,
            m.calories, m.protein, m.carbs, m.fat, m.fibre, m.foods
     FROM meals m
     WHERE m.user_id = $1 AND m.log_date >= $2::date AND m.log_date <= $3::date`,
    [userId, startDateKey, endDateKey],
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

async function fetchHydrationByDates(
  userId: string,
  dateKeys: string[],
): Promise<Map<string, number>> {
  const hydrationByDate = new Map<string, number>();
  if (dateKeys.length === 0) return hydrationByDate;

  const { rows } = await pool.query<{ date: string; glasses: number }>(
    `SELECT log_date::text AS date, glasses
     FROM daily_hydration
     WHERE user_id = $1 AND log_date = ANY($2::date[])`,
    [userId, dateKeys],
  );

  for (const row of rows) {
    hydrationByDate.set(row.date, row.glasses);
  }
  return hydrationByDate;
}


function groupRowsByDate(rows: MealRow[]): Map<string, MealRow[]> {
  const dayMap = new Map<string, MealRow[]>();
  for (const row of rows) {
    const list = dayMap.get(row.log_date) ?? [];
    list.push(row);
    dayMap.set(row.log_date, list);
  }
  return dayMap;
}

function buildDailySnapshot(
  dateKey: string,
  dayRows: MealRow[],
  hydrationGlasses: number,
  targets: ExtendedNutritionTargets,
) {
  const totals = aggregateTotals(dayRows);
  const foods = collectFoods(dayRows);
  const mealNames = collectMealNames(dayRows);
  const classification = classifyFoods(foods, mealNames);
  return buildPeriodSnapshot(
    periodLabel(dateKey),
    dateKey,
    totals,
    classification,
    hydrationGlasses,
    targets,
  );
}

function buildRangeSnapshot(
  label: string,
  endDateKey: string,
  startDateKey: string,
  rowsByDate: Map<string, MealRow[]>,
  hydrationByDate: Map<string, number>,
  targets: ExtendedNutritionTargets,
) {
  const dailySnapshots = enumerateLogDateKeys(startDateKey, endDateKey).map((dateKey) =>
    buildDailySnapshot(
      dateKey,
      rowsByDate.get(dateKey) ?? [],
      hydrationByDate.get(dateKey) ?? 0,
      targets,
    ),
  );
  return aggregateDailySnapshots(label, endDateKey, dailySnapshots);
}

function periodLabel(dateKey: string): string {
  return formatLogDateLabel(dateKey);
}

function filterRowsForDate(rows: MealRow[], dateKey: string): MealRow[] {
  return rows.filter((row) => row.log_date === dateKey);
}

function weekStartDateKey(): string {
  return offsetLogDateKey(todayDateKey(), -6);
}

function buildTrendsFromRows(
  rows: MealRow[],
  targets: ExtendedNutritionTargets,
) {
  const metrics = computeWeeklyMetricsFromRows(rows);
  return buildWeeklyTrends({
    avgDailyProtein: metrics.avgDailyProtein,
    proteinTarget: targets.dailyProteinG,
    avgPlantFoods: metrics.avgPlantFoods,
    plantTarget: targets.dailyPlantServes,
    gutScore: metrics.gutScore,
    processedPercent: metrics.processedPercent,
    omega3Days: metrics.omega3Days,
    daysWithMeals: metrics.daysWithMeals,
  });
}

function filterRowsForRange(rows: MealRow[], startDateKey: string, endDateKey: string): MealRow[] {
  return rows.filter((row) => row.log_date >= startDateKey && row.log_date <= endDateKey);
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
    const key = row.log_date;
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
    plantTotal += classification.plantServes ?? classification.plants.length;
    gutScoreTotal += weeklyGutScore(classification);
    if (classification.omega3.length > 0) omega3Days += 1;

    const mealFoodMap = new Map<string, string[]>();
    for (const row of dayRows) {
      mealFoodMap.set(row.meal_name, [...(row.foods ?? [])]);
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
  targetDateKey?: string,
): Promise<NutritionDashboardApiResponse> {
  const dateKey =
    targetDateKey && isValidLogDateKey(targetDateKey) ? targetDateKey : todayDateKey();
  const previousKey = offsetLogDateKey(dateKey, -1);
  const thisWeekStart = offsetLogDateKey(dateKey, -6);
  const lastWeekStart = offsetLogDateKey(dateKey, -13);
  const lastWeekEnd = offsetLogDateKey(dateKey, -7);
  const thisMonthStart = monthStartKey(dateKey);
  const lastMonthStart = previousMonthStartKey(dateKey);
  const lastMonthEnd = previousMonthEndKey(dateKey);
  const comparisonFetchStart = lastMonthStart;

  const comparisonDateKeys = [
    ...enumerateLogDateKeys(thisWeekStart, dateKey),
    ...enumerateLogDateKeys(lastWeekStart, lastWeekEnd),
    ...enumerateLogDateKeys(thisMonthStart, dateKey),
    ...enumerateLogDateKeys(lastMonthStart, lastMonthEnd),
  ];
  const uniqueComparisonDateKeys = [...new Set(comparisonDateKeys)];

  const [
    { rows: userRows },
    weekRows,
    dayRows,
    comparisonRows,
    hydrationGlasses,
    previousHydrationGlasses,
    hydrationByDate,
    cachedInsight,
  ] = await Promise.all([
    pool.query<UserRow>(
      `SELECT goal, weight_kg, height_cm, age, gender FROM users WHERE id = $1`,
      [userId],
    ),
    fetchMealRowsSince(userId, weekStartDateKey()),
    fetchMealRowsBetween(userId, previousKey, dateKey),
    fetchMealRowsSince(userId, comparisonFetchStart),
    fetchHydrationGlasses(userId, dateKey),
    fetchHydrationGlasses(userId, previousKey),
    fetchHydrationByDates(userId, uniqueComparisonDateKeys),
    dateKey === todayDateKey() ? getCachedDailyInsight(userId, dateKey) : Promise.resolve(null),
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

  const todayRows = filterRowsForDate(dayRows, dateKey);
  const previousRows = filterRowsForDate(dayRows, previousKey);
  const totals = aggregateTotals(todayRows);
  const previousTotals = aggregateTotals(previousRows);
  const foods = collectFoods(todayRows);
  const previousFoods = collectFoods(previousRows);
  const mealNames = collectMealNames(todayRows);
  const previousMealNames = collectMealNames(previousRows);
  const classification = classifyFoods(foods, mealNames);
  const previousClassification = classifyFoods(previousFoods, previousMealNames);

  const gaps = computeNutritionGaps(totals, targets, classification, hydrationGlasses);
  const score = computeNutritionScore(
    totals,
    targets,
    classification,
    hydrationGlasses,
  );
  const status = scoreStatus(score);
  const proteinPillar = buildProteinPillar(totals, targets, classification);
  const fibrePillar = buildFibrePillar(totals, targets, classification);
  const plantsPillar = buildPlantsPillar(classification, targets);
  const hydrationPillar = buildHydrationPillarFromGlasses(
    hydrationGlasses,
    targets.dailyHydrationGlasses,
  );
  const mealTypes = collectMealTypes(todayRows);
  const coachContext = {
    logDate: dateKey,
    mealTypes,
    mealsCount: totals.mealsCount,
  };
  const coachSummary = buildCoachSummary(gaps, score, {
    protein: proteinPillar.progress,
    fibre: fibrePillar.progress,
    plants: plantsPillar.progress,
    hydration: hydrationPillar.progress,
  }, coachContext);
  const recommendations = buildFoodRecommendations(gaps, coachContext);
  const monthRows = filterRowsForRange(comparisonRows, thisMonthStart, dateKey);

  const currentSnapshot = buildPeriodSnapshot(
    periodLabel(dateKey),
    dateKey,
    totals,
    classification,
    hydrationGlasses,
    targets,
  );
  const previousSnapshot = buildPeriodSnapshot(
    periodLabel(previousKey),
    previousKey,
    previousTotals,
    previousClassification,
    previousHydrationGlasses,
    targets,
  );
  const comparison = buildDayComparison(currentSnapshot, previousSnapshot);

  const comparisonRowsByDate = groupRowsByDate(comparisonRows);
  const thisWeekSnapshot = buildRangeSnapshot(
    "This week",
    dateKey,
    thisWeekStart,
    comparisonRowsByDate,
    hydrationByDate,
    targets,
  );
  const lastWeekSnapshot = buildRangeSnapshot(
    "Last week",
    lastWeekEnd,
    lastWeekStart,
    comparisonRowsByDate,
    hydrationByDate,
    targets,
  );
  const thisMonthSnapshot = buildRangeSnapshot(
    formatMonthLabel(dateKey),
    dateKey,
    thisMonthStart,
    comparisonRowsByDate,
    hydrationByDate,
    targets,
  );
  const lastMonthSnapshot = buildRangeSnapshot(
    formatMonthLabel(lastMonthStart),
    lastMonthEnd,
    lastMonthStart,
    comparisonRowsByDate,
    hydrationByDate,
    targets,
  );
  const weekComparison = buildWeekComparison(thisWeekSnapshot, lastWeekSnapshot);
  const monthComparison = buildMonthComparison(thisMonthSnapshot, lastMonthSnapshot);

  let lifeplateInsight = cachedInsight;
  if (!lifeplateInsight && dateKey === todayDateKey()) {
    lifeplateInsight = await generateLifeplateInsight({
      goal: user?.goal ?? null,
      totals,
      targets,
      plantCount: classification.plantServes ?? classification.plants.length,
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
      plantServes: classification.plantServes ?? classification.plants.length,
      protein: classification.protein,
      fibre: classification.fibre,
      carbs: classification.carbs,
      fermented: classification.fermented,
      prebiotic: classification.prebiotic,
      mealTypes,
    },
    hydration: { glasses: hydrationGlasses },
    recommendations,
    dayTrends: buildTrendsFromRows(todayRows, targets),
    weeklyTrends: buildTrendsFromRows(weekRows, targets),
    monthTrends: buildTrendsFromRows(monthRows, targets),
    lifeplateInsight: normalizeLifeplateInsight(lifeplateInsight ?? coachSummary),
    comparison,
    weekComparison,
    monthComparison,
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
