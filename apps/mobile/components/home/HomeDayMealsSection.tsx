import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListItem } from "@lifeplate/shared";
import { HomeMealsEmptyState } from "@/components/home/HomeMealsEmptyState";
import { SuggestedMealSlotCard } from "@/components/home/SuggestedMealSlotCard";
import { HomeMealsSkeleton } from "@/components/skeletons/HomeSkeletons";
import { TimelineMealCard } from "@/components/timeline/TimelineMealCard";
import { buildHomeMealsTimeline } from "@/lib/homeMealsTimeline";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  title: string;
  meals: MealListItem[];
  loading: boolean;
  showSkeleton: boolean;
  isViewingToday: boolean;
  dateLabel: string;
  onMealPress: (mealId: string) => void;
  onLogSuggested?: () => void;
  onLogPhoto?: () => void;
  onLogText?: () => void;
};

function formatCalories(total: number): string {
  return total.toLocaleString();
}

export function HomeDayMealsSection({
  title,
  meals,
  loading,
  showSkeleton,
  isViewingToday,
  dateLabel,
  onMealPress,
  onLogSuggested,
  onLogPhoto,
  onLogText,
}: Props) {
  const { items: timelineItems, suggestedSlot } = useMemo(
    () =>
      buildHomeMealsTimeline(meals, {
        highlightNextSlot: isViewingToday,
      }),
    [meals, isViewingToday],
  );

  const sortedMeals = useMemo(
    () => timelineItems.filter((item) => item.kind === "meal").map((item) => item.meal),
    [timelineItems],
  );

  const totalCalories = useMemo(() => {
    const logged = sortedMeals.filter((meal) => meal.calories != null);
    if (logged.length === 0) return null;
    return logged.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);
  }, [sortedMeals]);

  const totalProtein = useMemo(() => {
    const logged = sortedMeals.filter((meal) => meal.protein != null);
    if (logged.length === 0) return null;
    return logged.reduce((sum, meal) => sum + (meal.protein ?? 0), 0);
  }, [sortedMeals]);

  const mealCount = sortedMeals.length;
  const summaryParts: string[] = [];
  if (mealCount > 0) {
    summaryParts.push(`${mealCount} ${mealCount === 1 ? "meal" : "meals"}`);
  }
  if (totalCalories != null) {
    summaryParts.push(`${formatCalories(totalCalories)} kcal`);
  }
  if (totalProtein != null) {
    summaryParts.push(`${Math.round(totalProtein)}g protein`);
  }

  const showEmptyState =
    !showSkeleton && !loading && mealCount === 0 && !(isViewingToday && suggestedSlot);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          {summaryParts.length > 0 ? (
            <Text variant="bodySmall" style={styles.summary}>
              {summaryParts.join(" · ")}
            </Text>
          ) : (
            <Text variant="bodySmall" style={styles.summary}>
              {isViewingToday
                ? "Your log for today will show up here."
                : `Nothing logged for ${dateLabel.toLowerCase()} yet.`}
            </Text>
          )}
        </View>
        {mealCount > 0 ? (
          <View style={styles.countPill}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#40916C" />
            <Text variant="labelMedium" style={styles.countText}>
              {mealCount}
            </Text>
          </View>
        ) : null}
      </View>

      {showEmptyState ? (
        <HomeMealsEmptyState
          title={isViewingToday ? "No meals yet today" : "Nothing logged"}
          subtitle={
            isViewingToday
              ? "Snap a photo or describe what you ate — you can edit before saving."
              : `No meals logged for ${dateLabel.toLowerCase()}.`
          }
          onLogPhoto={onLogPhoto}
          onLogText={onLogText}
        />
      ) : null}

      {showSkeleton ? (
        <HomeMealsSkeleton />
      ) : timelineItems.length > 0 ? (
        <View style={styles.list}>
          {timelineItems.map((item) =>
            item.kind === "meal" ? (
              <TimelineMealCard
                key={item.meal.id}
                meal={item.meal}
                onPress={() => onMealPress(item.meal.id)}
              />
            ) : (
              <SuggestedMealSlotCard
                key={`suggested-${item.slot}`}
                slot={item.slot}
                onPress={onLogSuggested}
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    letterSpacing: 0.15,
    color: "#1B4332",
  },
  summary: {
    opacity: 0.6,
    lineHeight: 18,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F0F7F4",
    borderWidth: 1,
    borderColor: "#D8F3DC",
  },
  countText: {
    color: "#1B4332",
    fontWeight: "700",
  },
  list: {
    gap: 0,
  },
});
