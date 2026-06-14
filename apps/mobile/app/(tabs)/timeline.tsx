import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Snackbar } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { TimelineDayHeader } from "@/components/timeline/TimelineDayHeader";
import { TimelineEmptyState } from "@/components/timeline/TimelineEmptyState";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { TimelineSummaryBar } from "@/components/timeline/TimelineSummaryBar";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useMeals } from "@/context/MealsContext";
import { deleteMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { countMealsThisWeek, groupMealsByDay } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

const UNDO_MS = 5000;

export default function TimelineScreen() {
  const {
    meals,
    loading,
    refreshing,
    loadMeals,
    refreshMeals,
    removeMealLocally,
    restoreMealLocally,
  } = useMeals();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const pendingRef = useRef<Map<string, { meal: MealListSummary; timer: ReturnType<typeof setTimeout> }>>(
    new Map(),
  );

  useFocusEffect(
    useCallback(() => {
      void loadMeals().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadMeals]),
  );

  function scheduleDelete(meal: MealListSummary) {
    removeMealLocally(meal.id);

    const existing = pendingRef.current.get(meal.id);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(async () => {
      pendingRef.current.delete(meal.id);
      try {
        await deleteMeal(meal.id);
        refreshAfterMealChange();
      } catch (e) {
        restoreMealLocally(meal);
        setSnackbar(friendlyErrorMessage(e));
      }
    }, UNDO_MS);

    pendingRef.current.set(meal.id, { meal, timer });
    setSnackbar("Meal deleted");
  }

  function undoDelete() {
    const entries = [...pendingRef.current.values()];
    if (entries.length === 0) return;
    const last = entries[entries.length - 1];
    clearTimeout(last.timer);
    pendingRef.current.delete(last.meal.id);
    restoreMealLocally(last.meal);
    setSnackbar(null);
  }

  const groups = groupMealsByDay(meals);
  const weekMeals = countMealsThisWeek(meals);

  return (
    <Screen padded={false} loading={loading && !refreshing && meals.length === 0}>
      <PremiumHeader
        title="Timeline"
        subtitle="Your health story, chronologically"
      />

      {meals.length > 0 ? (
        <TimelineSummaryBar totalMeals={meals.length} weekMeals={weekMeals} />
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshMeals().catch((e) => setSnackbar(friendlyErrorMessage(e)));
            }}
          />
        }
      >
        {groups.map((group) => (
          <View key={group.dateKey} style={styles.dayGroup}>
            <TimelineDayHeader
              day={group.day}
              subtitle={group.subtitle}
              mealCount={group.meals.length}
              isToday={group.isToday}
            />
            {group.meals.map((meal, index) => (
              <TimelineMealCard
                key={meal.id}
                meal={meal}
                isLast={index === group.meals.length - 1}
                onPress={() => router.push({ pathname: "/meal/edit", params: { id: meal.id } })}
                onDelete={() => scheduleDelete(meal)}
              />
            ))}
          </View>
        ))}

        {!loading && meals.length === 0 ? <TimelineEmptyState /> : null}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={UNDO_MS}
        action={
          pendingRef.current.size > 0
            ? { label: "Undo", onPress: undoDelete }
            : undefined
        }
      >
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dayGroup: {
    marginBottom: spacing.lg,
  },
});
