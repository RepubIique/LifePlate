import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useWeekInsights } from "@/context/WeekInsightsContext";
import { invalidateAllMealDetails } from "@/lib/mealDetailCache";

/** Meals + dashboard only — for edits that don't change streak / meals logged. */
export function useRefreshMealsAndDashboard() {
  const { refreshMeals } = useMeals();
  const { invalidateDashboard, refreshDashboard } = useNutritionDashboard();
  const { invalidateWeekInsights } = useWeekInsights();

  return useCallback(() => {
    void refreshMeals();
    invalidateDashboard();
    void refreshDashboard();
    invalidateWeekInsights();
  }, [refreshMeals, invalidateDashboard, refreshDashboard, invalidateWeekInsights]);
}

/** Full sync after create, delete, or log-date changes (streak / profile stats). */
export function useRefreshAfterMealChange() {
  const refreshMealsAndDashboard = useRefreshMealsAndDashboard();
  const { invalidateProfile, refreshProfile } = useAuth();

  return useCallback(() => {
    invalidateAllMealDetails();
    refreshMealsAndDashboard();
    invalidateProfile();
    void refreshProfile();
  }, [refreshMealsAndDashboard, invalidateProfile, refreshProfile]);
}
