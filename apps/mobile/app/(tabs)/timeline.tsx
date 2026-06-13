import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Snackbar, Text } from "react-native-paper";
import type { MealListItem } from "@lifeplate/shared";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { deleteMeal, fetchMeals } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { capitalize, formatMealTime, groupMealsByDay } from "@/lib/mealUtils";
import { premiumStyles } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

const UNDO_MS = 5000;

export default function TimelineScreen() {
  const [meals, setMeals] = useState<MealListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const pendingRef = useRef<Map<string, { meal: MealListItem; timer: ReturnType<typeof setTimeout> }>>(
    new Map(),
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMeals();
      setMeals(data);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function scheduleDelete(meal: MealListItem) {
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));

    const existing = pendingRef.current.get(meal.id);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(async () => {
      pendingRef.current.delete(meal.id);
      try {
        await deleteMeal(meal.id);
      } catch (e) {
        setMeals((prev) => [meal, ...prev]);
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
    setMeals((prev) => {
      if (prev.some((m) => m.id === last.meal.id)) return prev;
      return [last.meal, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
    setSnackbar(null);
  }

  const groups = groupMealsByDay(meals);

  return (
    <Screen padded={false}>
      <PremiumHeader
        title="Timeline"
        subtitle={meals.length ? `${meals.length} meals logged` : "Your health story, chronologically"}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        {loading && !refreshing ? <ActivityIndicator style={styles.loader} /> : null}
        {groups.map((group) => (
          <View key={group.day} style={styles.dayGroup}>
            <Text variant="titleSmall" style={styles.dayLabel}>
              {group.day}
            </Text>
            {group.meals.map((meal) => (
              <MealRowCard
                key={meal.id}
                mealName={meal.mealName}
                subtitle={`${capitalize(meal.mealType ?? "meal")} · ${formatMealTime(meal.createdAt)}`}
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
  loader: { marginTop: spacing.xl },
  dayGroup: { marginBottom: spacing.lg },
  dayLabel: {
    opacity: 0.65,
    marginBottom: spacing.sm,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
