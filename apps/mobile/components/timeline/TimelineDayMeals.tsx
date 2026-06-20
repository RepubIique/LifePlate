import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import type { MealListSummary } from "@lifeplate/shared";
import { MealTimelineRail, railPositionForIndex } from "@/components/home/MealTimelineRail";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { mealsShareDisplaySlot } from "@/lib/mealSlots";
import { mealMatchesTimelineSearch } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  dateKey: string;
  meals: MealListSummary[];
  searchQuery?: string;
  dayMatchesSearch?: boolean;
  onReorder: (dateKey: string, meals: MealListSummary[]) => void;
  onPress: (mealId: string) => void;
  onDelete: (meal: MealListSummary) => void;
};

export function TimelineDayMeals({
  dateKey,
  meals,
  searchQuery = "",
  dayMatchesSearch = false,
  onReorder,
  onPress,
  onDelete,
}: Props) {
  const moveMeal = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= meals.length || fromIndex === toIndex) return;
      const next = [...meals];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReorder(dateKey, next);
    },
    [dateKey, meals, onReorder],
  );

  if (meals.length === 0) return null;

  const isSearching = searchQuery.trim().length > 0;
  const visibleMeals =
    isSearching && !dayMatchesSearch
      ? meals.filter((meal) => mealMatchesTimelineSearch(meal, searchQuery))
      : meals;

  if (visibleMeals.length === 0) return null;

  const canReorder = visibleMeals.length > 1 && (!isSearching || dayMatchesSearch);

  return (
    <View style={styles.timeline}>
      {visibleMeals.map((meal, index) => (
        <View key={meal.id} style={styles.timelineRow}>
          <MealTimelineRail
            position={railPositionForIndex(index, visibleMeals.length)}
            variant="filled"
            showReorder={canReorder}
            canMoveUp={
              index > 0 && mealsShareDisplaySlot(meal, visibleMeals[index - 1]!)
            }
            canMoveDown={
              index < visibleMeals.length - 1 &&
              mealsShareDisplaySlot(meal, visibleMeals[index + 1]!)
            }
            onMoveUp={() => moveMeal(index, index - 1)}
            onMoveDown={() => moveMeal(index, index + 1)}
          />
          <View style={styles.timelineContent}>
            <TimelineMealCard
              meal={meal}
              onPress={() => onPress(meal.id)}
              onDelete={() => onDelete(meal)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
});
