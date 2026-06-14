import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Snackbar } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { todayDateKey } from "@lifeplate/shared";
import { LogDatePickerModal } from "@/components/timeline/LogDatePickerModal";
import { TimelineDayHeader } from "@/components/timeline/TimelineDayHeader";
import { TimelineDayHydration } from "@/components/timeline/TimelineDayHydration";
import { TimelineEmptyState } from "@/components/timeline/TimelineEmptyState";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { TimelineSummaryBar } from "@/components/timeline/TimelineSummaryBar";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { useMeals } from "@/context/MealsContext";
import { useAuth } from "@/context/AuthContext";
import { deleteMeal, fetchHydrationHistory } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { useDebouncedHydration } from "@/lib/useDebouncedHydration";
import { buildTimelineDayGroups, countMealsThisWeek } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

const UNDO_MS = 5000;
const HYDRATION_TARGET = 8;

export default function TimelineScreen() {
  const { profile } = useAuth();
  const { setPendingLogDate } = usePendingLogDate();
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
  const refreshAfterMealChangeRef = useRef(refreshAfterMealChange);
  refreshAfterMealChangeRef.current = refreshAfterMealChange;
  const {
    hydrationByDate,
    syncingDate,
    replaceFromServer: replaceHydrationFromServer,
    adjustHydration,
  } = useDebouncedHydration({
    onSynced: () => refreshAfterMealChangeRef.current(),
    onError: (e) => setSnackbar(friendlyErrorMessage(e)),
  });
  const [pastDayPickerOpen, setPastDayPickerOpen] = useState(false);
  const [hydrationPickerOpen, setHydrationPickerOpen] = useState(false);
  const pendingRef = useRef<Map<string, { meal: MealListSummary; timer: ReturnType<typeof setTimeout> }>>(
    new Map(),
  );

  const hydrationTarget =
    profile?.nutritionTargets?.dailyHydrationGlasses ?? HYDRATION_TARGET;

  const loadTimeline = useCallback(async () => {
    const [{ days }] = await Promise.all([fetchHydrationHistory(60), loadMeals()]);
    const map: Record<string, number> = {};
    for (const day of days) {
      map[day.date] = day.glasses;
    }
    replaceHydrationFromServer(map);
  }, [loadMeals, replaceHydrationFromServer]);

  useFocusEffect(
    useCallback(() => {
      void loadTimeline().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadTimeline]),
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

  function startMealLogForDay(dateKey: string) {
    setPendingLogDate(dateKey);
    router.push("/(tabs)");
  }

  function handlePastDaySelected(dateKey: string) {
    setPastDayPickerOpen(false);
    startMealLogForDay(dateKey);
  }

  function handlePastHydrationSelected(dateKey: string) {
    setHydrationPickerOpen(false);
    adjustHydration(dateKey, 1);
  }

  const groups = useMemo(
    () => buildTimelineDayGroups(meals, hydrationByDate),
    [meals, hydrationByDate],
  );
  const weekMeals = countMealsThisWeek(meals);
  const hasAnyEntries = groups.length > 0;

  return (
    <Screen padded={false} loading={loading && !refreshing && meals.length === 0}>
      <PremiumHeader
        title="Timeline"
        subtitle="Your health story, chronologically"
      />

      {hasAnyEntries ? (
        <TimelineSummaryBar totalMeals={meals.length} weekMeals={weekMeals} />
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshMeals()
                .then(() => fetchHydrationHistory(60))
                .then(({ days }) => {
                  const map: Record<string, number> = {};
                  for (const day of days) map[day.date] = day.glasses;
                  replaceHydrationFromServer(map);
                })
                .catch((e) => setSnackbar(friendlyErrorMessage(e)));
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
            <TimelineDayHydration
              glasses={group.hydrationGlasses}
              target={hydrationTarget}
              syncing={syncingDate === group.dateKey}
              onIncrement={() => adjustHydration(group.dateKey, 1)}
              onDecrement={() => adjustHydration(group.dateKey, -1)}
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
            <Button
              mode="text"
              icon="plus"
              onPress={() => startMealLogForDay(group.dateKey)}
              style={styles.addMeal}
            >
              Add meal for this day
            </Button>
          </View>
        ))}

        {!loading && !hasAnyEntries ? (
          <View style={styles.emptyWrap}>
            <TimelineEmptyState />
            <Button mode="outlined" onPress={() => startMealLogForDay(todayDateKey())}>
              Log today&apos;s first meal
            </Button>
            <Button mode="text" onPress={() => setPastDayPickerOpen(true)}>
              Log a past day
            </Button>
          </View>
        ) : (
          <View style={styles.pastActions}>
            <Button mode="text" onPress={() => setPastDayPickerOpen(true)}>
              Log another past day
            </Button>
            <Button mode="text" onPress={() => setHydrationPickerOpen(true)}>
              Log past hydration
            </Button>
          </View>
        )}
      </ScrollView>

      <LogDatePickerModal
        visible={pastDayPickerOpen}
        selectedDateKey={todayDateKey()}
        onSelect={handlePastDaySelected}
        onClose={() => setPastDayPickerOpen(false)}
      />

      <LogDatePickerModal
        visible={hydrationPickerOpen}
        selectedDateKey={todayDateKey()}
        onSelect={handlePastHydrationSelected}
        onClose={() => setHydrationPickerOpen(false)}
      />

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
  addMeal: {
    alignSelf: "flex-start",
    marginTop: -spacing.xs,
  },
  emptyWrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pastActions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignItems: "center",
  },
});
