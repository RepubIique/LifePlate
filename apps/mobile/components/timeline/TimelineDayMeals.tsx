import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import type { MealListSummary } from "@lifeplate/shared";
import { MealTimelineRail, railPositionForIndex } from "@/components/home/MealTimelineRail";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { mealsShareDisplaySlot } from "@/lib/mealSlots";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  dateKey: string;
  meals: MealListSummary[];
  onReorder: (dateKey: string, meals: MealListSummary[]) => void;
  onPress: (mealId: string) => void;
  onDelete: (meal: MealListSummary) => void;
};

export function TimelineDayMeals({
  dateKey,
  meals,
  onReorder,
  onPress,
  onDelete,
}: Props) {
  const canReorder = meals.length > 1;

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

  return (
    <View style={styles.timeline}>
      {meals.map((meal, index) => (
        <View key={meal.id} style={styles.timelineRow}>
          <MealTimelineRail
            position={railPositionForIndex(index, meals.length)}
            variant="filled"
            showReorder={canReorder}
            canMoveUp={
              index > 0 && mealsShareDisplaySlot(meal, meals[index - 1]!)
            }
            canMoveDown={
              index < meals.length - 1 &&
              mealsShareDisplaySlot(meal, meals[index + 1]!)
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
