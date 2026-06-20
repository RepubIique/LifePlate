import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/context/GamificationContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useWeekInsights } from "@/context/WeekInsightsContext";
import { clearCachedDayDashboards } from "@/lib/dayDashboardCache";
import { invalidateAllMealDetails } from "@/lib/mealDetailCache";

type RefreshMealsAndDashboardOptions = {
  /** Refetch meal list (default true). Skip when local meal patch is already correct. */
  meals?: boolean;
  /** Refetch today's nutrition dashboard (default true). */
  dashboard?: boolean;
  /** Mark week insights stale without fetching (default true). */
  invalidateInsights?: boolean;
  /** Clear per-day dashboard disk cache (default true). */
  clearDayDashboards?: boolean;
};

function invalidateDayDashboardCaches(userId: string | undefined) {
  if (!userId) return;
  void clearCachedDayDashboards(userId);
}

/** Meals + dashboard — for edits that don't change streak / meals logged. */
export function useRefreshMealsAndDashboard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { refreshMeals } = useMeals();
  const { refreshDashboard } = useNutritionDashboard();
  const { invalidateWeekInsights } = useWeekInsights();

  return useCallback(
    (options?: RefreshMealsAndDashboardOptions) => {
      const refreshMealsList = options?.meals ?? true;
      const refreshTodayDashboard = options?.dashboard ?? true;
      const markInsightsStale = options?.invalidateInsights ?? true;
      const clearDayCaches = options?.clearDayDashboards ?? true;

      if (clearDayCaches) invalidateDayDashboardCaches(userId);
      if (refreshMealsList) void refreshMeals();
      if (refreshTodayDashboard) void refreshDashboard();
      if (markInsightsStale) invalidateWeekInsights();
    },
    [userId, refreshMeals, refreshDashboard, invalidateWeekInsights],
  );
}

/** Dashboard only — after macro edits when meals list is already patched locally. */
export function useRefreshDashboardOnly() {
  const refreshMealsAndDashboard = useRefreshMealsAndDashboard();
  return useCallback(
    () => refreshMealsAndDashboard({ meals: false, dashboard: true }),
    [refreshMealsAndDashboard],
  );
}

/** Full sync after create, delete, log-date changes, or shares (streak / profile stats). */
export function useRefreshAfterMealChange() {
  const refreshMealsAndDashboard = useRefreshMealsAndDashboard();
  const { refreshGamification } = useGamification();
  const { invalidateProfile, refreshProfile } = useAuth();

  return useCallback(
    (options?: { refreshGamification?: boolean }) => {
      invalidateAllMealDetails();
      refreshMealsAndDashboard();
      invalidateProfile();
      void refreshProfile();
      if (options?.refreshGamification) {
        void refreshGamification();
      }
    },
    [
      refreshMealsAndDashboard,
      invalidateProfile,
      refreshProfile,
      refreshGamification,
    ],
  );
}
