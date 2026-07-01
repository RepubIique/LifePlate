import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { formatPlanDateLabel } from "@lifeplate/shared";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { useAppColors } from "@/context/ThemeContext";
import { MEAL_SLOTS, mealsInDaySlot, unmatchedDayMeals } from "@/lib/mealSlots";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  dateKey: string;
  meals: MealListSummary[];
  onMealPress: (mealId: string) => void;
  onPencilIn: (dateKey: string) => void;
};

export function PlanDaySection({ dateKey, meals, onMealPress, onPencilIn }: Props) {
  const { semantic, ui } = useAppColors();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      section: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.xs,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
      },
      title: {
        color: semantic.primary,
        letterSpacing: 0.1,
        fontWeight: "600",
      },
      pencilBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: ui.borderSubtle,
        borderStyle: "dashed",
      },
      pencilText: {
        color: semantic.primary,
        opacity: 0.85,
      },
      emptyHint: {
        opacity: 0.5,
        paddingBottom: spacing.xs,
      },
    }),
  );

  const dayMeals = meals.filter((meal) => meal.logDate === dateKey);
  const hasMeals = dayMeals.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="titleSmall" style={styles.title}>
          {formatPlanDateLabel(dateKey)}
        </Text>
      </View>

      {hasMeals ? (
        <>
          {MEAL_SLOTS.flatMap((slot) =>
            mealsInDaySlot(dayMeals, slot.key).map((meal) => (
              <TimelineMealCard
                key={meal.id}
                meal={meal}
                dimmed
                onPress={() => onMealPress(meal.id)}
              />
            )),
          )}
          {unmatchedDayMeals(dayMeals).map((meal) => (
            <TimelineMealCard
              key={meal.id}
              meal={meal}
              dimmed
              onPress={() => onMealPress(meal.id)}
            />
          ))}
        </>
      ) : (
        <Text variant="bodySmall" style={styles.emptyHint}>
          Nothing penciled in yet.
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.pencilBtn, pressed && { opacity: 0.85 }]}
        onPress={() => onPencilIn(dateKey)}
      >
        <MaterialCommunityIcons name="pencil-outline" size={18} color={semantic.primary} />
        <Text variant="labelLarge" style={styles.pencilText}>
          Pencil in meal
        </Text>
      </Pressable>
    </View>
  );
}
