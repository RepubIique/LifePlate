import {
  buildEnergyMetrics,
  buildGutHealthSummary,
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
  type PillarProgress,
} from "@lifeplate/shared";

export type NutritionDashboardView = Omit<NutritionDashboardResponse, "essentials"> & {
  essentials: Omit<NutritionDashboardResponse["essentials"], "hydration"> & {
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

export function expandDashboard(
  api: NutritionDashboardApiResponse,
  nutritionTargets: NutritionTargets | null,
): NutritionDashboardView {
  const targets = toExtendedTargets(nutritionTargets);
  const classification: FoodClassification = {
    plants: api.today.plants,
    fermented: api.today.fermented,
    prebiotic: api.today.prebiotic,
    omega3: [],
    processedMealCount: 0,
  };
  const totals = api.today.totals;

  return {
    date: api.date,
    score: api.score,
    scoreStatus: api.scoreStatus,
    coachSummary: api.coachSummary,
    essentials: {
      protein: buildProteinPillar(totals, targets),
      fibre: buildFibrePillar(totals, targets),
      plants: buildPlantsPillar(classification, targets),
      hydration: buildHydrationPillarFromGlasses(
        api.hydration.glasses,
        targets.dailyHydrationGlasses,
      ),
    },
    energyBalance: buildEnergyMetrics(totals),
    gutHealth: buildGutHealthSummary(classification),
    recommendations: api.recommendations,
    weeklyTrends: api.weeklyTrends,
    lifeplateInsight: api.lifeplateInsight,
  };
}
