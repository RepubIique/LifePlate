import type {
  DailyTotals,
  ExtendedNutritionTargets,
  FoodClassification,
  HydrationDayRecord,
  MealListItem,
  NutritionTargets,
  PeriodComparison,
  PeriodSnapshot,
  TrendStatus,
  UserProfile,
  WeeklyTrendItem,
} from "@lifeplate/shared";
import {
  aggregateDailySnapshots,
  buildEnergyMetrics,
  buildFoodRecommendations,
  buildGutHealthSummary,
  buildPeriodSnapshot,
  buildWeeklyTrends,
  classifyFoods,
  computeNutritionGaps,
  countProcessedMeals,
  defaultExtendedNutritionTargets,
  enumerateLogDateKeys,
  formatLogDateLabel,
  mealLogDateKey,
  weeklyGutScore,
} from "@lifeplate/shared";
import type { ReportWindowSpec } from "./reportWindows";

export type DailyScorePoint = {
  dateKey: string;
  score: number;
  hasData: boolean;
};

export type MacroPeriodAverages = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  daysWithMeals: number;
};

export type WindowInsights = {
  mealsLogged: number;
  proteinAverage: number;
  vegetablesConsumed: number;
  mostCommonFood: string | null;
  homeCookedPercent: number;
  takeawayPercent: number;
};

export type PatternsToWatch = {
  processedPercent: number;
  omega3Days: number;
  daysWithMeals: number;
  muscleSupport: TrendStatus;
  gutHealth: TrendStatus;
  plantDiversity: TrendStatus;
  omega3Intake: TrendStatus;
};

function toExtendedTargets(nutritionTargets: NutritionTargets | null): ExtendedNutritionTargets {
  if (!nutritionTargets) return defaultExtendedNutritionTargets();
  return {
    dailyCalories: nutritionTargets.dailyCalories,
    dailyFibreG: nutritionTargets.dailyFibreG,
    dailyProteinG: nutritionTargets.dailyProteinG,
    dailyPlantServes: nutritionTargets.dailyPlantServes,
    dailyHydrationGlasses: nutritionTargets.dailyHydrationGlasses,
  };
}

function mealsInRange(meals: MealListItem[], startKey: string, endKey: string): MealListItem[] {
  return meals.filter((meal) => {
    const key = mealLogDateKey(meal);
    return key >= startKey && key <= endKey;
  });
}

function groupMealsByDay(meals: MealListItem[]): Map<string, MealListItem[]> {
  const map = new Map<string, MealListItem[]>();
  for (const meal of meals) {
    const key = mealLogDateKey(meal);
    const list = map.get(key) ?? [];
    list.push(meal);
    map.set(key, list);
  }
  return map;
}

function aggregateMealTotals(meals: MealListItem[]): DailyTotals {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fibre = 0;
  const ids = new Set<string>();

  for (const meal of meals) {
    ids.add(meal.id);
    calories += meal.calories ?? 0;
    protein += meal.protein ?? 0;
    carbs += meal.carbs ?? 0;
    fat += meal.fat ?? 0;
    fibre += meal.fibre ?? 0;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fibre: Math.round(fibre),
    mealsCount: ids.size,
  };
}

function collectFoods(meals: MealListItem[]): string[] {
  return [
    ...new Set(
      meals
        .flatMap((m) => m.foods ?? [])
        .map((f) => f.trim())
        .filter(Boolean),
    ),
  ];
}

function collectMealNames(meals: MealListItem[]): string[] {
  return [...new Set(meals.map((m) => m.mealName))];
}

function hydrationMap(records: HydrationDayRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of records) {
    map.set(row.date, row.glasses);
  }
  return map;
}

function buildDailySnapshot(
  dateKey: string,
  dayMeals: MealListItem[],
  hydrationGlasses: number,
  targets: ExtendedNutritionTargets,
): PeriodSnapshot {
  const totals = aggregateMealTotals(dayMeals);
  const foods = collectFoods(dayMeals);
  const classification = classifyFoods(foods, collectMealNames(dayMeals));
  return buildPeriodSnapshot(
    formatLogDateLabel(dateKey),
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
  mealsByDay: Map<string, MealListItem[]>,
  hydrationByDate: Map<string, number>,
  targets: ExtendedNutritionTargets,
): PeriodSnapshot {
  const dailySnapshots = enumerateLogDateKeys(startDateKey, endDateKey).map((dateKey) =>
    buildDailySnapshot(dateKey, mealsByDay.get(dateKey) ?? [], hydrationByDate.get(dateKey) ?? 0, targets),
  );
  return aggregateDailySnapshots(label, endDateKey, dailySnapshots);
}

function computeWeeklyMetrics(
  meals: MealListItem[],
  targets: ExtendedNutritionTargets,
): {
  avgDailyProtein: number;
  avgPlantFoods: number;
  gutScore: number;
  processedPercent: number;
  omega3Days: number;
  daysWithMeals: number;
} {
  const dayMap = groupMealsByDay(meals);
  const daysWithMeals = dayMap.size;
  let proteinTotal = 0;
  let plantTotal = 0;
  let gutScoreTotal = 0;
  let omega3Days = 0;
  const processedMealRows: Array<{ mealName: string; foods: string[] }> = [];

  for (const [, dayMeals] of dayMap) {
    const totals = aggregateMealTotals(dayMeals);
    proteinTotal += totals.protein;
    const foods = collectFoods(dayMeals);
    const classification = classifyFoods(foods, collectMealNames(dayMeals));
    plantTotal += classification.plantServes ?? classification.plants.length;
    gutScoreTotal += weeklyGutScore(classification);
    if (classification.omega3.length > 0) omega3Days += 1;

    const mealFoodMap = new Map<string, string[]>();
    for (const meal of dayMeals) {
      mealFoodMap.set(meal.mealName, [...(meal.foods ?? [])]);
    }
    for (const [mealName, foodsList] of mealFoodMap) {
      processedMealRows.push({ mealName, foods: foodsList });
    }
  }

  const processedCount = countProcessedMeals(processedMealRows);
  const totalMeals = new Set(meals.map((m) => m.id)).size;
  const processedPercent = totalMeals > 0 ? Math.round((processedCount / totalMeals) * 100) : 0;

  return {
    avgDailyProtein: daysWithMeals > 0 ? Math.round(proteinTotal / daysWithMeals) : 0,
    avgPlantFoods: daysWithMeals > 0 ? Math.round(plantTotal / daysWithMeals) : 0,
    gutScore: daysWithMeals > 0 ? Math.round(gutScoreTotal / daysWithMeals) : 0,
    processedPercent,
    omega3Days,
    daysWithMeals,
  };
}

function computeWindowInsights(meals: MealListItem[]): WindowInsights {
  const dayMap = groupMealsByDay(meals);
  let proteinTotal = 0;
  const plantFoods = new Set<string>();
  const foodWords = new Map<string, number>();
  let homeCooked = 0;
  let takeaway = 0;
  let withSource = 0;

  for (const meal of meals) {
    for (const food of meal.foods ?? []) {
      const word = food.trim().split(/\s+/)[0]?.toLowerCase();
      if (word) {
        plantFoods.add(food.trim().toLowerCase());
        foodWords.set(word, (foodWords.get(word) ?? 0) + 1);
      }
    }
    if (meal.mealSource === "home_cooked") {
      homeCooked += 1;
      withSource += 1;
    } else if (meal.mealSource === "takeaway") {
      takeaway += 1;
      withSource += 1;
    }
  }

  for (const [, dayMeals] of dayMap) {
    proteinTotal += aggregateMealTotals(dayMeals).protein;
  }

  const daysWithMeals = dayMap.size;
  let mostCommonFood: string | null = null;
  let maxCount = 0;
  for (const [word, count] of foodWords) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonFood = word;
    }
  }

  const homeCookedPercent = withSource > 0 ? Math.round((homeCooked / withSource) * 100) : 0;
  const takeawayPercent = withSource > 0 ? Math.round((takeaway / withSource) * 100) : 0;

  return {
    mealsLogged: meals.length,
    proteinAverage: daysWithMeals > 0 ? Math.round(proteinTotal / daysWithMeals) : 0,
    vegetablesConsumed: plantFoods.size,
    mostCommonFood,
    homeCookedPercent,
    takeawayPercent,
  };
}

function computeMacroAverages(meals: MealListItem[]): MacroPeriodAverages {
  const dayMap = groupMealsByDay(meals);
  const daysWithMeals = dayMap.size;
  if (daysWithMeals === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, daysWithMeals: 0 };
  }

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fibre = 0;

  for (const [, dayMeals] of dayMap) {
    const totals = aggregateMealTotals(dayMeals);
    calories += totals.calories;
    protein += totals.protein;
    carbs += totals.carbs;
    fat += totals.fat;
    fibre += totals.fibre;
  }

  return {
    calories: Math.round(calories / daysWithMeals),
    protein: Math.round(protein / daysWithMeals),
    carbs: Math.round(carbs / daysWithMeals),
    fat: Math.round(fat / daysWithMeals),
    fibre: Math.round(fibre / daysWithMeals),
    daysWithMeals,
  };
}

function mergedClassification(meals: MealListItem[]): FoodClassification {
  const foods = collectFoods(meals);
  return classifyFoods(foods, collectMealNames(meals));
}

export type ComputedReportMetrics = {
  comparison: PeriodComparison;
  dailyScores: DailyScorePoint[];
  windowInsights: WindowInsights;
  macroAverages: MacroPeriodAverages;
  trends: WeeklyTrendItem[];
  patterns: PatternsToWatch;
  gutHealth: ReturnType<typeof buildGutHealthSummary>;
  energyBalance: ReturnType<typeof buildEnergyMetrics>;
  recommendations: ReturnType<typeof buildFoodRecommendations>;
  periodTotals: DailyTotals;
  periodClassification: FoodClassification;
};

export function computeReportMetrics(
  profile: UserProfile,
  window: ReportWindowSpec,
  allMeals: MealListItem[],
  hydrationRecords: HydrationDayRecord[],
): ComputedReportMetrics {
  const targets = toExtendedTargets(profile.nutritionTargets);
  const hydrationByDate = hydrationMap(hydrationRecords);
  const mealsByDay = groupMealsByDay(allMeals);

  const windowMeals = mealsInRange(allMeals, window.startKey, window.endKey);

  const current = buildRangeSnapshot(
    window.currentLabel,
    window.endKey,
    window.startKey,
    mealsByDay,
    hydrationByDate,
    targets,
  );
  const previous = buildRangeSnapshot(
    window.previousLabel,
    window.previousEndKey,
    window.previousStartKey,
    mealsByDay,
    hydrationByDate,
    targets,
  );

  const comparison: PeriodComparison = {
    period: window.id.includes("month") ? "month" : "week",
    currentLabel: window.currentLabel,
    previousLabel: window.previousLabel,
    current,
    previous,
  };

  const dailyScores = enumerateLogDateKeys(window.startKey, window.endKey).map((dateKey) => {
    const snap = buildDailySnapshot(
      dateKey,
      mealsByDay.get(dateKey) ?? [],
      hydrationByDate.get(dateKey) ?? 0,
      targets,
    );
    return { dateKey, score: snap.score, hasData: snap.hasData };
  });

  const weeklyMetrics = computeWeeklyMetrics(windowMeals, targets);
  const trends = buildWeeklyTrends({
    avgDailyProtein: weeklyMetrics.avgDailyProtein,
    proteinTarget: targets.dailyProteinG,
    avgPlantFoods: weeklyMetrics.avgPlantFoods,
    plantTarget: targets.dailyPlantServes,
    gutScore: weeklyMetrics.gutScore,
    processedPercent: weeklyMetrics.processedPercent,
    omega3Days: weeklyMetrics.omega3Days,
    daysWithMeals: weeklyMetrics.daysWithMeals,
  });

  const trendByLabel = Object.fromEntries(trends.map((t) => [t.label, t.status])) as Record<
    string,
    TrendStatus
  >;

  const periodTotals = aggregateMealTotals(windowMeals);
  const periodClassification = mergedClassification(windowMeals);
  const gutHealth = buildGutHealthSummary(periodClassification);
  const energyBalance = buildEnergyMetrics(periodTotals);
  const avgHydration =
    dailyScores.length > 0
      ? Math.round(
          dailyScores.reduce(
            (sum, day) => sum + (hydrationByDate.get(day.dateKey) ?? 0),
            0,
          ) / dailyScores.length,
        )
      : 0;
  const gaps = computeNutritionGaps(
    periodTotals,
    targets,
    periodClassification,
    avgHydration,
  );
  const recommendations = buildFoodRecommendations(gaps, {
    hour: 12,
    logDate: window.endKey,
    mealTypes: [],
    mealsCount: periodTotals.mealsCount,
  });

  return {
    comparison,
    dailyScores,
    windowInsights: computeWindowInsights(windowMeals),
    macroAverages: computeMacroAverages(windowMeals),
    trends,
    patterns: {
      processedPercent: weeklyMetrics.processedPercent,
      omega3Days: weeklyMetrics.omega3Days,
      daysWithMeals: weeklyMetrics.daysWithMeals,
      muscleSupport: trendByLabel["Muscle Support"] ?? "moderate",
      gutHealth: trendByLabel["Gut Health"] ?? "moderate",
      plantDiversity: trendByLabel["Plant Diversity"] ?? "moderate",
      omega3Intake: trendByLabel["Omega-3 Intake"] ?? "moderate",
    },
    gutHealth,
    energyBalance,
    recommendations,
    periodTotals,
    periodClassification,
  };
}

export function hydrationForWindow(
  records: HydrationDayRecord[],
  window: ReportWindowSpec,
): HydrationDayRecord[] {
  return records.filter((r) => r.date >= window.startKey && r.date <= window.endKey);
}
