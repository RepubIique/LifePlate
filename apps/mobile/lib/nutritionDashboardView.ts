import {
  buildCoachSummary,
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

export function expandDashboard(
  api: NutritionDashboardApiResponse,
  nutritionTargets: NutritionTargets | null,
  options?: ExpandDashboardOptions,
): NutritionDashboardView {
  const targets = toExtendedTargets(nutritionTargets);
  const classification: FoodClassification = {
    plants: api.today.plants,
    plantServes: api.today.plantServes ?? api.today.plants.length,
    protein: api.today.protein ?? [],
    fibre: api.today.fibre ?? [],
    carbs: api.today.carbs ?? [],
    fermented: api.today.fermented,
    prebiotic: api.today.prebiotic,
    omega3: [],
    processedMealCount: 0,
  };
  const totals = api.today.totals;
  const protein = buildProteinPillar(totals, targets, classification);
  const fibre = buildFibrePillar(totals, targets, classification);
  const plants = buildPlantsPillar(classification, targets);
  const carbs = buildCarbsPillar(totals, targets, classification);
  const hydration = buildHydrationPillarFromGlasses(
    api.hydration.glasses,
    targets.dailyHydrationGlasses,
  );
  const gaps = computeNutritionGaps(totals, targets, classification, api.hydration.glasses);
  const score = computeNutritionScore(
    totals,
    targets,
    classification,
    api.hydration.glasses,
  );
  const pillarProgress = {
    protein: protein.progress,
    fibre: fibre.progress,
    plants: plants.progress,
    hydration: hydration.progress,
  };
  const mergedMealTypes = [
    ...new Set(
      [...(api.today.mealTypes ?? []), ...(options?.mealTypes ?? [])].map((type) =>
        type.trim().toLowerCase(),
      ),
    ),
  ].filter(Boolean);
  const coachContext = {
    hour: options?.hour ?? new Date().getHours(),
    logDate: api.date,
    mealTypes: mergedMealTypes,
    mealsCount: totals.mealsCount,
  };
  const hasActivity =
    totals.mealsCount > 0 ||
    totals.protein > 0 ||
    totals.fibre > 0 ||
    api.hydration.glasses > 0;
  const coachSummary = buildCoachSummary(gaps, score, pillarProgress, coachContext);
  const plateMessage = buildPlateMessage(
    [protein, fibre, plants, carbs],
    hasActivity,
    coachContext,
  );
  const comparison = resolveComparison(
    api,
    score,
    totals.mealsCount,
    hasActivity,
    {
      protein: Math.round(protein.progress * 100),
      fibre: Math.round(fibre.progress * 100),
      plants: Math.round(plants.progress * 100),
      hydration: Math.round(hydration.progress * 100),
    },
  );

  return {
    date: api.date,
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
    weeklyTrends: api.weeklyTrends,
    lifeplateInsight: api.lifeplateInsight,
    comparison,
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
