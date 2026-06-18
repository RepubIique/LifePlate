import {
  buildDayComparison,
  buildEnergyMetrics,
  buildGutHealthSummary,
  buildCarbsPillar,
  buildFibrePillar,
  buildHydrationPillarFromGlasses,
  buildPlantsPillar,
  buildProteinPillar,
  defaultExtendedNutritionTargets,
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
    pillars: { protein: 0, fibre: 0, plants: 0, hydration: 0 },
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
  const comparison = resolveComparison(
    api,
    api.score,
    totals.mealsCount,
    totals.mealsCount > 0 || api.hydration.glasses > 0,
    {
      protein: Math.round(protein.progress * 100),
      fibre: Math.round(fibre.progress * 100),
      plants: Math.round(plants.progress * 100),
      hydration: Math.round(hydration.progress * 100),
    },
  );

  return {
    date: api.date,
    score: api.score,
    scoreStatus: api.scoreStatus,
    coachSummary: api.coachSummary,
    essentials: {
      protein,
      fibre,
      plants,
      carbs,
      hydration,
    },
    energyBalance: buildEnergyMetrics(totals),
    gutHealth: buildGutHealthSummary(classification),
    recommendations: api.recommendations,
    weeklyTrends: api.weeklyTrends,
    lifeplateInsight: api.lifeplateInsight,
    comparison,
  };
}
