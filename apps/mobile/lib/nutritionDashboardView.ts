import {
  buildCoachSummary,
  buildComparisonPillars,
  buildDayComparison,
  buildEnergyMetrics,
  buildFoodRecommendations,
  buildGutHealthSummary,
  buildPlateMessage,
  buildCarbsPillar,
  buildFibrePillar,
  buildHydrationPillarFromGlasses,
  buildPlantsPillar,
  buildProteinPillar,
  computeNutritionGaps,
  computeNutritionScore,
  defaultExtendedNutritionTargets,
  scoreStatus,
  type ExtendedNutritionTargets,
  type FoodClassification,
  type NutritionDashboardApiResponse,
  type NutritionDashboardResponse,
  type NutritionTargets,
  type PeriodComparison,
  type PeriodSnapshot,
  type PillarProgress,
  type WeeklyTrendItem,
} from "@lifeplate/shared";

export type NutritionDashboardView = Omit<NutritionDashboardResponse, "essentials"> & {
  essentials: Omit<NutritionDashboardResponse["essentials"], "hydration"> & {
    carbs: PillarProgress;
    hydration: PillarProgress;
  };
  plateMessage: string | null;
};

export type ExpandDashboardOptions = {
  /** Local hour (0–23) for time-aware coaching. Defaults to device time. */
  hour?: number;
  /** Extra meal types to merge (e.g. from local meal list before API refresh). */
  mealTypes?: readonly string[];
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

function emptySnapshot(label: string, date: string): PeriodSnapshot {
  return {
    label,
    date,
    score: 0,
    mealsCount: 0,
    pillars: { protein: 0, fibre: 0, plants: 0, carbs: 0, fat: 0, hydration: 0 },
    hasData: false,
  };
}

function resolveComparison(
  api: NutritionDashboardApiResponse,
  score: number,
  mealsCount: number,
  hasData: boolean,
  pillars: PeriodSnapshot["pillars"],
): PeriodComparison {
  if (api.comparison) {
    return {
      ...api.comparison,
      current: {
        ...api.comparison.current,
        score,
        mealsCount,
        hasData,
        pillars,
      },
    };
  }

  return buildDayComparison(
    emptySnapshot("Today", api.date),
    emptySnapshot("Yesterday", api.date),
  );
}

function emptyComparison(period: PeriodComparison["period"]): PeriodComparison {
  const empty = emptySnapshot("—", "");
  if (period === "week") {
    return {
      period,
      currentLabel: "This week",
      previousLabel: "Last week",
      current: empty,
      previous: empty,
    };
  }
  if (period === "month") {
    return {
      period,
      currentLabel: "This month",
      previousLabel: "Last month",
      current: empty,
      previous: empty,
    };
  }
  return buildDayComparison(
    emptySnapshot("Today", ""),
    emptySnapshot("Yesterday", ""),
  );
}

/** Backfill fields missing from older cached dashboard payloads. */
export function normalizeDashboardApi(
  api: NutritionDashboardApiResponse,
): NutritionDashboardApiResponse {
  const weeklyTrends: WeeklyTrendItem[] = api.weeklyTrends ?? [];
  const comparison =
    api.comparison ??
    buildDayComparison(emptySnapshot("Today", api.date), emptySnapshot("Yesterday", api.date));

  return {
    ...api,
    dayTrends: api.dayTrends ?? weeklyTrends,
    weeklyTrends,
    monthTrends: api.monthTrends ?? weeklyTrends,
    comparison,
    weekComparison: api.weekComparison ?? emptyComparison("week"),
    monthComparison: api.monthComparison ?? emptyComparison("month"),
  };
}

export function expandDashboard(
  api: NutritionDashboardApiResponse,
  nutritionTargets: NutritionTargets | null,
  options?: ExpandDashboardOptions,
): NutritionDashboardView {
  const normalized = normalizeDashboardApi(api);
  const targets = toExtendedTargets(nutritionTargets);
  const classification: FoodClassification = {
    plants: normalized.today.plants,
    plantServes: normalized.today.plantServes ?? normalized.today.plants.length,
    protein: normalized.today.protein ?? [],
    fibre: normalized.today.fibre ?? [],
    carbs: normalized.today.carbs ?? [],
    fermented: normalized.today.fermented,
    prebiotic: normalized.today.prebiotic,
    omega3: [],
    processedMealCount: 0,
  };
  const totals = normalized.today.totals;
  const protein = buildProteinPillar(totals, targets, classification);
  const fibre = buildFibrePillar(totals, targets, classification);
  const plants = buildPlantsPillar(classification, targets);
  const carbs = buildCarbsPillar(totals, targets, classification);
  const hydration = buildHydrationPillarFromGlasses(
    normalized.hydration.glasses,
    targets.dailyHydrationGlasses,
  );
  const gaps = computeNutritionGaps(totals, targets, classification, normalized.hydration.glasses);
  const score = computeNutritionScore(
    totals,
    targets,
    classification,
    normalized.hydration.glasses,
  );
  const pillarProgress = {
    protein: protein.progress,
    fibre: fibre.progress,
    plants: plants.progress,
    hydration: hydration.progress,
  };
  const mergedMealTypes = [
    ...new Set(
      [...(normalized.today.mealTypes ?? []), ...(options?.mealTypes ?? [])].map((type) =>
        type.trim().toLowerCase(),
      ),
    ),
  ].filter(Boolean);
  const coachContext = {
    hour: options?.hour ?? new Date().getHours(),
    logDate: normalized.date,
    mealTypes: mergedMealTypes,
    mealsCount: totals.mealsCount,
  };
  const hasActivity =
    totals.mealsCount > 0 ||
    totals.protein > 0 ||
    totals.fibre > 0 ||
    normalized.hydration.glasses > 0;
  const coachSummary = buildCoachSummary(gaps, score, pillarProgress, coachContext);
  const plateMessage = buildPlateMessage(
    [protein, fibre, plants, carbs],
    hasActivity,
    coachContext,
  );
  const comparison = resolveComparison(
    normalized,
    score,
    totals.mealsCount,
    hasActivity,
    buildComparisonPillars(totals, classification, normalized.hydration.glasses, targets),
  );

  return {
    date: normalized.date,
    score,
    scoreStatus: scoreStatus(score),
    coachSummary,
    plateMessage,
    essentials: {
      protein,
      fibre,
      plants,
      carbs,
      hydration,
    },
    energyBalance: buildEnergyMetrics(totals),
    gutHealth: buildGutHealthSummary(classification),
    recommendations: buildFoodRecommendations(gaps, coachContext),
    dayTrends: normalized.dayTrends,
    weeklyTrends: normalized.weeklyTrends,
    monthTrends: normalized.monthTrends,
    lifeplateInsight: normalized.lifeplateInsight,
    comparison,
    weekComparison: normalized.weekComparison,
    monthComparison: normalized.monthComparison,
  };
}

/** Recompute coaching copy when local meal types are ahead of the API payload. */
export function refreshDashboardCoaching(
  view: NutritionDashboardView,
  nutritionTargets: NutritionTargets | null,
  mealTypes: readonly string[],
  mealsCount: number,
  options?: ExpandDashboardOptions,
): Pick<NutritionDashboardView, "coachSummary" | "plateMessage" | "recommendations"> {
  const targets = toExtendedTargets(nutritionTargets);
  const mergedMealTypes = [
    ...new Set(mealTypes.map((type) => type.trim().toLowerCase()).filter(Boolean)),
  ];
  const coachContext = {
    hour: options?.hour ?? new Date().getHours(),
    logDate: view.date,
    mealTypes: mergedMealTypes,
    mealsCount,
  };
  const { essentials } = view;
  const totals = {
    calories: 0,
    protein: essentials.protein.consumed,
    carbs: essentials.carbs.consumed,
    fat: view.energyBalance.fats.grams,
    fibre: essentials.fibre.consumed,
    mealsCount,
  };
  const classification: FoodClassification = {
    plants: essentials.plants.sources ?? [],
    plantServes: essentials.plants.consumed,
    protein: essentials.protein.sources ?? [],
    fibre: essentials.fibre.sources ?? [],
    carbs: essentials.carbs.sources ?? [],
    fermented: [],
    prebiotic: [],
    omega3: [],
    processedMealCount: 0,
  };
  const gaps = computeNutritionGaps(
    totals,
    targets,
    classification,
    essentials.hydration.consumed,
  );
  const pillarProgress = {
    protein: essentials.protein.progress,
    fibre: essentials.fibre.progress,
    plants: essentials.plants.progress,
    hydration: essentials.hydration.progress,
  };
  const hasActivity =
    mealsCount > 0 ||
    totals.protein > 0 ||
    totals.fibre > 0 ||
    essentials.hydration.consumed > 0;

  return {
    coachSummary: buildCoachSummary(gaps, view.score, pillarProgress, coachContext),
    plateMessage: buildPlateMessage(
      [essentials.protein, essentials.fibre, essentials.plants, essentials.carbs],
      hasActivity,
      coachContext,
    ),
    recommendations: buildFoodRecommendations(gaps, coachContext),
  };
}
