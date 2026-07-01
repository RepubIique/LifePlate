import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { buildPlanSuggestions, inferMealType, offsetLogDateKey, planHorizonEndKey, todayDateKey, type MealType, type PlanSuggestion } from "@lifeplate/shared";
import { PlanDaySection } from "@/components/plan/PlanDaySection";
import { PencilMealModal } from "@/components/plan/PencilMealModal";
import { PlanSuggestionsCard } from "@/components/plan/PlanSuggestionsCard";
import { PlanWeekNavigator } from "@/components/plan/PlanWeekNavigator";
import { PlanSkeleton } from "@/components/skeletons/PlanSkeleton";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { createPlannedMeal, fetchPlannedMeals } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { openPlannedMeal } from "@/lib/mealNavigation";
import { PLAN_WEEK_OFFSETS, planWeekLabel, planWeekVisibleDateKeys } from "@/lib/planWeek";

export default function PlanScreen() {
  const { invalidateMeals, refreshMeals } = useMeals();
  const { dashboard, loadDashboard } = useNutritionDashboard();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plannedMeals, setPlannedMeals] = useState<Awaited<ReturnType<typeof fetchPlannedMeals>>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [pencilOpen, setPencilOpen] = useState(false);
  const [pencilDateKey, setPencilDateKey] = useState(() => offsetLogDateKey(todayDateKey(), 1));
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<PlanSuggestion | null>(null);

  const visibleDateKeys = useMemo(
    () => planWeekVisibleDateKeys(weekOffset),
    [weekOffset],
  );

  const loadPlanned = useCallback(async (options?: { refresh?: boolean }) => {
    const today = todayDateKey();
    const from = offsetLogDateKey(today, 1);
    const to = planHorizonEndKey();
    if (options?.refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const meals = await fetchPlannedMeals(from, to);
      setPlannedMeals(meals);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlanned();
      void loadDashboard();
    }, [loadPlanned, loadDashboard]),
  );

  const planSuggestions = useMemo(() => {
    if (!dashboard) return [];
    const { protein, fibre, plants, hydration } = dashboard.essentials;
    return buildPlanSuggestions({
      proteinG: Math.max(0, protein.target - protein.consumed),
      fibreG: Math.max(0, fibre.target - fibre.consumed),
      plantServes: Math.max(0, plants.target - plants.consumed),
      hydrationGlasses: Math.max(0, hydration.target - hydration.consumed),
      caloriesGap: 0,
    });
  }, [dashboard]);

  const openPencil = useCallback((dateKey: string) => {
    setPencilDateKey(dateKey);
    setMealName("");
    setMealType(inferMealType());
    setNotes("");
    setActiveSuggestion(null);
    setPencilOpen(true);
  }, []);

  const handlePencilSubmit = useCallback(async () => {
    setSaving(true);
    try {
      await createPlannedMeal({
        mealName: mealName.trim(),
        mealType,
        logDate: pencilDateKey,
        notes: notes.trim() || null,
      });
      setPencilOpen(false);
      invalidateMeals();
      await Promise.all([loadPlanned({ refresh: true }), refreshMeals()]);
      setSnackbar("Meal penciled in");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [
    invalidateMeals,
    loadPlanned,
    mealName,
    mealType,
    notes,
    pencilDateKey,
    refreshMeals,
  ]);

  const showSkeleton = loading && plannedMeals.length === 0;

  return (
    <>
      <Screen
        scroll
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPlanned({ refresh: true })}
          />
        }
      >
        <PremiumHeader title="Plan" />
        <PlanWeekNavigator
          label={planWeekLabel(weekOffset)}
          weekOffset={weekOffset}
          canGoPrev={weekOffset > PLAN_WEEK_OFFSETS[0]}
          canGoNext={weekOffset < PLAN_WEEK_OFFSETS[PLAN_WEEK_OFFSETS.length - 1]}
          onPrev={() => setWeekOffset((value) => Math.max(0, value - 1))}
          onNext={() =>
            setWeekOffset((value) =>
              Math.min(PLAN_WEEK_OFFSETS[PLAN_WEEK_OFFSETS.length - 1], value + 1),
            )
          }
        />
        <PlanSuggestionsCard
          suggestions={planSuggestions}
          onSelectSuggestion={(suggestion) => {
            const dateKey = visibleDateKeys[0] ?? offsetLogDateKey(todayDateKey(), 1);
            setPencilDateKey(dateKey);
            setMealName("");
            setMealType(inferMealType());
            setNotes(suggestion.noteHint);
            setActiveSuggestion(suggestion);
            setPencilOpen(true);
          }}
        />
        {showSkeleton ? (
          <PlanSkeleton />
        ) : visibleDateKeys.length === 0 ? (
          <View />
        ) : (
          visibleDateKeys.map((dateKey) => (
            <PlanDaySection
              key={dateKey}
              dateKey={dateKey}
              meals={plannedMeals}
              onMealPress={openPlannedMeal}
              onPencilIn={openPencil}
            />
          ))
        )}
      </Screen>

      <PencilMealModal
        visible={pencilOpen}
        logDateKey={pencilDateKey}
        mealName={mealName}
        mealType={mealType}
        notes={notes}
        loading={saving}
        activeSuggestion={activeSuggestion}
        onChangeLogDateKey={setPencilDateKey}
        onChangeMealName={setMealName}
        onChangeMealType={setMealType}
        onChangeNotes={setNotes}
        onSubmit={() => void handlePencilSubmit()}
        onClose={() => setPencilOpen(false)}
      />

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>
    </>
  );
}
