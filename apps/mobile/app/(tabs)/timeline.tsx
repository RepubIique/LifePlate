import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import type { MealListItem } from "@lifeplate/shared";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useMeals } from "@/context/MealsContext";
import { deleteMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { formatMealTime, formatMealTypeLabel, groupMealsByDay } from "@/lib/mealUtils";
import { premiumStyles } from "@/src/theme/premium";
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
  const pendingRef = useRef<Map<string, { meal: MealListItem; timer: ReturnType<typeof setTimeout> }>>(
    new Map(),
  );

  useFocusEffect(
    useCallback(() => {
      void loadMeals().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadMeals]),
  );

  function scheduleDelete(meal: MealListItem) {
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

  return (
    <Screen padded={false} loading={loading && !refreshing}>
      <PremiumHeader
        title="Timeline"
        subtitle={meals.length ? `${meals.length} meals logged` : "Your health story, chronologically"}
      />
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
          <View key={group.day} style={styles.dayGroup}>
            <Text variant="titleSmall" style={styles.dayLabel}>
              {group.day}
            </Text>
            {group.meals.map((meal) => (
              <MealRowCard
                key={meal.id}
                mealName={meal.mealName}
                subtitle={`${formatMealTypeLabel(meal.mealType)} · ${formatMealTime(meal.createdAt)}`}
                imageUrl={meal.imageUrl}
                onPress={() => router.push({ pathname: "/meal/edit", params: { id: meal.id } })}
                onDelete={() => scheduleDelete(meal)}
              />
            ))}
          </View>
        ))}
        {!loading && meals.length === 0 ? (
          <Text variant="bodyMedium" style={premiumStyles.empty}>
            Your meal history will appear here.
          </Text>
        ) : null}
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  dayGroup: { marginBottom: spacing.lg },
  dayLabel: {
    opacity: 0.65,
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
