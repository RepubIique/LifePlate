import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { FormattedNotesText } from "@/components/meal/FormattedNotesText";
import { MealImage } from "@/components/MealImage";
import { PremiumCard } from "@/components/PremiumCard";
import {
  formatMealTime,
  formatMealTypeLabel,
  mealTypeIcon,
} from "@/lib/mealUtils";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  meal: MealListSummary;
  dimmed?: boolean;
  onPress: () => void;
  onDelete?: () => void;
};

function NutritionChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="labelMedium" style={styles.chipText}>
        {label}
      </Text>
    </View>
  );
}

export function TimelineMealCard({
  meal,
  dimmed = false,
  onPress,
  onDelete,
}: Props) {
  const icon = mealTypeIcon(meal.mealType);
  const typeLabel = formatMealTypeLabel(meal.mealType);
  const time = formatMealTime(meal.createdAt);

  return (
    <View style={[styles.row, dimmed && styles.rowDimmed]}>
      <PremiumCard style={styles.card} noBlur>
        <View style={styles.cardInner}>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
          >
            <MealImage
              mealId={meal.id}
              cloudUrl={meal.imageUrl}
              mealType={meal.mealType}
              style={styles.image}
              placeholderStyle={styles.imagePlaceholder}
              placeholderIconSize={36}
            />

            <View style={styles.body}>
              <View style={styles.metaRow}>
                <View style={styles.typeBadge}>
                  <MaterialCommunityIcons name={icon} size={14} color={semantic.primary} />
                  <Text variant="labelMedium" style={styles.typeText}>
                    {typeLabel}
                  </Text>
                </View>
                <Text variant="labelMedium" style={styles.time}>
                  {time}
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
                {meal.mealName}
              </Text>

              {meal.notes?.trim() ? (
                <FormattedNotesText
                  value={meal.notes}
                  style={styles.notes}
                  numberOfLines={2}
                />
              ) : null}

              {meal.sharedByName ? (
                <Text variant="bodySmall" style={styles.sharedBy} numberOfLines={1}>
                  Shared by {meal.sharedByName}
                </Text>
              ) : null}

              {meal.calories != null || meal.protein != null || meal.fibre != null ? (
                <View style={styles.chips}>
                  {meal.calories != null ? (
                    <NutritionChip label={`${meal.calories} kcal`} />
                  ) : null}
                  {meal.protein != null ? (
                    <NutritionChip label={`${meal.protein}g protein`} />
                  ) : null}
                  {meal.fibre != null ? (
                    <NutritionChip label={`${meal.fibre}g fibre`} />
                  ) : null}
                </View>
              ) : null}
            </View>
          </Pressable>

          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete meal"
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && styles.deleteBtnPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color="#95A5A6"
              />
            </Pressable>
          ) : null}
        </View>
      </PremiumCard>
    </View>
  );
}

const THUMB = 80;

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  rowDimmed: {
    opacity: 0.52,
  },
  card: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: THUMB + spacing.sm * 2,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  mainPressed: {
    opacity: 0.94,
  },
  image: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
  },
  imagePlaceholder: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    backgroundColor: ui.trackBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 6,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ui.selectedBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeText: {
    color: semantic.primary,
    letterSpacing: 0.1,
  },
  time: {
    opacity: 0.5,
  },
  name: {
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  notes: {
    opacity: 0.65,
    lineHeight: 18,
  },
  sharedBy: {
    opacity: 0.55,
    color: semantic.primary,
    fontSize: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: ui.trackBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipText: {
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  deleteBtn: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: ui.borderSubtle,
  },
  deleteBtnPressed: {
    backgroundColor: "#FDF2F2",
  },
});
