import { useMemo } from "react";
import type { GamificationStatsInput } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/context/GamificationContext";
import { useHydration } from "@/context/HydrationContext";
import { useMeals } from "@/context/MealsContext";
import { buildGamificationStatsInput } from "@/lib/computeLocalGamificationStats";

export function useGamificationStatsInput(): GamificationStatsInput | null {
  const { profile } = useAuth();
  const { meals } = useMeals();
  const { hydrationByDate } = useHydration();
  const { serverStats } = useGamification();

  const hydrationTarget = profile?.nutritionTargets?.dailyHydrationGlasses ?? 8;

  return useMemo(() => {
    if (!profile) return null;
    return buildGamificationStatsInput(
      profile,
      meals,
      hydrationByDate,
      hydrationTarget,
      serverStats,
    );
  }, [profile, meals, hydrationByDate, hydrationTarget, serverStats]);
}
