import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import type { MealListSummary } from "@lifeplate/shared";
import { todayDateKey, mealLogDateKey } from "@lifeplate/shared";
import { sortMealsByDaySlots } from "@/lib/mealSlots";
import { LogDatePickerModal } from "@/components/timeline/LogDatePickerModal";
import { TimelineDayMeals } from "@/components/timeline/TimelineDayMeals";
import { TimelineDayHeader } from "@/components/timeline/TimelineDayHeader";
import { TimelineDayHydration } from "@/components/timeline/TimelineDayHydration";
import { TimelineEmptyState } from "@/components/timeline/TimelineEmptyState";
import { TimelineSummaryBar } from "@/components/timeline/TimelineSummaryBar";
import { TimelineSkeleton } from "@/components/skeletons/TimelineSkeleton";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { useMeals } from "@/context/MealsContext";
import { useHydration } from "@/context/HydrationContext";
import { useAuth } from "@/context/AuthContext";
import { useFriends } from "@/context/FriendsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { deleteMeal, reorderMeals } from "@/lib/api";
import { deleteMealImage } from "@/lib/mealImages";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { useMealPhotoUpload, uploadStageLabel } from "@/lib/useMealPhotoUpload";
import { openMealEdit } from "@/lib/mealNavigation";
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
    refreshMeals,
    removeMealLocally,
    restoreMealLocally,
    reorderDayMealsLocally,
  } = useMeals();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const { uploading, uploadStage, error, setError, retryLastAsset, lastAssetRef } =
    useMealPhotoUpload();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const refreshAfterMealChangeRef = useRef(refreshAfterMealChange);
  refreshAfterMealChangeRef.current = refreshAfterMealChange;
  const { pendingShareCount, loadFriends } = useFriends();
  const { patchHydration } = useNutritionDashboard();
  const {
    hydrationByDate,
    syncingDate,
    refreshHydration,
    adjustHydration,
  } = useHydration();
  const [pastDayPickerOpen, setPastDayPickerOpen] = useState(false);
  const [hydrationPickerOpen, setHydrationPickerOpen] = useState(false);
  const pendingRef = useRef<Map<string, { meal: MealListSummary; timer: ReturnType<typeof setTimeout> }>>(
    new Map(),
  );

  const hydrationTarget =
    profile?.nutritionTargets?.dailyHydrationGlasses ?? HYDRATION_TARGET;

  useFocusEffect(
    useCallback(() => {
      void loadFriends().catch(() => undefined);
    }, [loadFriends]),
  );

  function confirmDelete(meal: MealListSummary) {
    const label = meal.mealName?.trim() || "this meal";
    Alert.alert(
      "Delete meal?",
      `Are you sure you want to delete "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => scheduleDelete(meal),
        },
      ],
    );
  }

  function scheduleDelete(meal: MealListSummary) {
    removeMealLocally(meal.id);

    const existing = pendingRef.current.get(meal.id);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(async () => {
      pendingRef.current.delete(meal.id);
      try {
        await deleteMeal(meal.id);
        await deleteMealImage(meal.id);
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

  const adjustTimelineHydration = useCallback(
    (dateKey: string, delta: number) => {
      const current = hydrationByDate[dateKey] ?? 0;
      adjustHydration(dateKey, delta);
      if (dateKey === todayDateKey()) {
        patchHydration(Math.max(0, Math.min(24, current + delta)));
      }
    },
    [adjustHydration, hydrationByDate, patchHydration],
  );

  const handlePastHydrationSelected = useCallback(
    (dateKey: string) => {
      setHydrationPickerOpen(false);
      adjustTimelineHydration(dateKey, 1);
    },
    [adjustTimelineHydration],
  );

  const handleDayMealsReorder = useCallback(
    (dateKey: string, orderedMeals: MealListSummary[]) => {
      const previous = sortMealsByDaySlots(
        meals.filter((meal) => mealLogDateKey(meal) === dateKey),
      );
      reorderDayMealsLocally(dateKey, orderedMeals);
      void reorderMeals({
        dateKey,
        mealIds: orderedMeals.map((meal) => meal.id),
      }).catch(async (e) => {
        reorderDayMealsLocally(dateKey, previous);
        await refreshMeals();
        setSnackbar(friendlyErrorMessage(e));
      });
    },
    [meals, reorderDayMealsLocally, refreshMeals],
  );

  const groups = useMemo(
    () => buildTimelineDayGroups(meals, hydrationByDate),
    [meals, hydrationByDate],
  );
  const weekMeals = countMealsThisWeek(meals);
  const hasAnyEntries = groups.length > 0;
  const showSkeleton = loading && !refreshing && meals.length === 0;

  return (
    <Screen padded={false}>
      <PremiumHeader
        title="Timeline"
        subtitle="Your health story, chronologically"
      />

      {pendingShareCount > 0 ? (
        <Pressable
          style={styles.shareBanner}
          onPress={() => router.push("/(tabs)/friends")}
        >
          <Text variant="bodyMedium" style={styles.shareBannerText}>
            {pendingShareCount} meal share{pendingShareCount === 1 ? "" : "s"} waiting — review on Friends
          </Text>
        </Pressable>
      ) : null}

      {hasAnyEntries ? (
        <TimelineSummaryBar totalMeals={meals.length} weekMeals={weekMeals} />
      ) : null}

      {uploading ? (
        <View style={styles.uploadBanner}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={styles.uploadText}>
            {uploadStageLabel(uploadStage)}
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshMeals()
                .then(() => refreshHydration())
                .catch((e) => setSnackbar(friendlyErrorMessage(e)));
            }}
          />
        }
      >
        {showSkeleton ? <TimelineSkeleton /> : null}

        {!showSkeleton
          ? groups.map((group) => (
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
              onIncrement={() => adjustTimelineHydration(group.dateKey, 1)}
              onDecrement={() => adjustTimelineHydration(group.dateKey, -1)}
            />
            <TimelineDayMeals
              dateKey={group.dateKey}
              meals={group.meals}
              onReorder={handleDayMealsReorder}
              onPress={(mealId) => openMealEdit(mealId, "timeline")}
              onDelete={confirmDelete}
            />
            <Button
              mode="text"
              icon="plus"
              onPress={() => startMealLogForDay(group.dateKey)}
              style={styles.addMeal}
            >
              Add meal for this day
            </Button>
          </View>
        ))
          : null}

        {!showSkeleton && !loading && !hasAnyEntries ? (
          <View style={styles.emptyWrap}>
            <TimelineEmptyState />
            <Button mode="outlined" onPress={() => startMealLogForDay(todayDateKey())}>
              Log today&apos;s first meal
            </Button>
            <Button mode="text" onPress={() => setPastDayPickerOpen(true)}>
              Log a past day
            </Button>
          </View>
        ) : !showSkeleton ? (
          <View style={styles.pastActions}>
            <Button mode="text" onPress={() => setPastDayPickerOpen(true)}>
              Log another past day
            </Button>
            <Button mode="text" onPress={() => setHydrationPickerOpen(true)}>
              Log past hydration
            </Button>
          </View>
        ) : null}
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

      <BottomSnackbar
        visible={!!error || !!snackbar}
        onDismiss={() => {
          setError(null);
          setSnackbar(null);
        }}
        duration={error ? 6000 : UNDO_MS}
        action={
          error && lastAssetRef.current
            ? { label: "Retry", onPress: () => void retryLastAsset() }
            : pendingRef.current.size > 0 && !error
              ? { label: "Undo", onPress: undoDelete }
              : undefined
        }
      >
        {error ?? snackbar}
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  uploadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: "#F8FBF9",
  },
  uploadText: { opacity: 0.75 },
  shareBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: "#D8F3DC",
  },
  shareBannerText: {
    color: "#1B4332",
    textAlign: "center",
  },
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
