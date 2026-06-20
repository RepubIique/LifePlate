import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
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
  const handleDragEnd = useCallback(
    ({ data }: { data: MealListSummary[] }) => {
      onReorder(dateKey, data);
    },
    [dateKey, onReorder],
  );

  if (meals.length === 0) return null;

  return (
    <DraggableFlatList
      data={meals}
      keyExtractor={(item) => item.id}
      onDragBegin={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onDragEnd={handleDragEnd}
      scrollEnabled={false}
      activationDistance={10}
      renderItem={({
        item,
        drag,
        isActive,
        getIndex,
      }: RenderItemParams<MealListSummary>) => {
        const index = getIndex() ?? 0;
        return (
          <ScaleDecorator activeScale={1.02}>
            <TimelineMealCard
              meal={item}
              isLast={index === meals.length - 1}
              dragging={isActive}
              onPress={() => onPress(item.id)}
              onLongPress={drag}
              onDelete={() => onDelete(item)}
            />
          </ScaleDecorator>
        );
      }}
    />
  );
}
