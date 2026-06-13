import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";

export function useRefreshAfterMealChange() {
  const { refreshMeals } = useMeals();
  const { invalidateDashboard, refreshDashboard } = useNutritionDashboard();
  const { invalidateProfile, refreshProfile } = useAuth();

  return useCallback(() => {
    void refreshMeals();
    invalidateDashboard();
    void refreshDashboard();
    invalidateProfile();
    void refreshProfile();
  }, [
    refreshMeals,
    invalidateDashboard,
    refreshDashboard,
    invalidateProfile,
    refreshProfile,
  ]);
}
