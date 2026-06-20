import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { View } from "react-native";
import type { MealListSummary } from "@lifeplate/shared";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";

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
    <View>
      {meals.map((meal, index) => (
        <TimelineMealCard
          key={meal.id}
          meal={meal}
          showReorder={canReorder}
          canMoveUp={index > 0}
          canMoveDown={index < meals.length - 1}
          onMoveUp={() => moveMeal(index, index - 1)}
          onMoveDown={() => moveMeal(index, index + 1)}
          onPress={() => onPress(meal.id)}
          onDelete={() => onDelete(meal)}
        />
      ))}
    </View>
  );
}
