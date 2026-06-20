import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { MealImage } from "@/components/MealImage";
import { PremiumCard } from "@/components/PremiumCard";
import {
  formatMealTime,
  formatMealTypeLabel,
  mealTypeIcon,
} from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  meal: MealListSummary;
  showReorder?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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

function ReorderButton({
  icon,
  disabled,
  onPress,
  label,
}: {
  icon: "chevron-up" | "chevron-down";
  disabled?: boolean;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.reorderButton,
        disabled && styles.reorderButtonDisabled,
        pressed && !disabled && styles.reorderButtonPressed,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={disabled ? "#D5DBD8" : "#636E72"}
      />
    </Pressable>
  );
}

export function TimelineMealCard({
  meal,
  showReorder = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onPress,
  onDelete,
}: Props) {
  const icon = mealTypeIcon(meal.mealType);
  const typeLabel = formatMealTypeLabel(meal.mealType);
  const time = formatMealTime(meal.createdAt);

  return (
    <View style={styles.row}>
      <PremiumCard style={styles.card} noBlur>
        <View style={styles.cardInner}>
          {showReorder ? (
            <View style={styles.reorderCol}>
              <ReorderButton
                icon="chevron-up"
                disabled={!canMoveUp}
                onPress={onMoveUp}
                label="Move meal earlier in the day"
              />
              <MaterialCommunityIcons
                name="menu"
                size={16}
                color="#B2BEC3"
                style={styles.gripIcon}
              />
              <ReorderButton
                icon="chevron-down"
                disabled={!canMoveDown}
                onPress={onMoveDown}
                label="Move meal later in the day"
              />
            </View>
          ) : null}

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
                  <MaterialCommunityIcons name={icon} size={14} color="#1B4332" />
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
                <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
                  {meal.notes.trim()}
                </Text>
              ) : null}

              {meal.calories != null || meal.protein != null ? (
                <View style={styles.chips}>
                  {meal.calories != null ? (
                    <NutritionChip label={`${meal.calories} kcal`} />
                  ) : null}
                  {meal.protein != null ? (
                    <NutritionChip label={`${meal.protein}g protein`} />
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
  reorderCol: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "#F7F9F8",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E2E8E4",
    paddingVertical: spacing.xs,
  },
  gripIcon: {
    marginVertical: 2,
  },
  reorderButton: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  reorderButtonPressed: {
    backgroundColor: "#E8EDEA",
  },
  reorderButtonDisabled: {
    opacity: 0.45,
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
    backgroundColor: "#EEF2F0",
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
    backgroundColor: "#D8F3DC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeText: {
    color: "#1B4332",
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
    fontStyle: "italic",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: "#F1F3F5",
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
    borderLeftColor: "#E2E8E4",
  },
  deleteBtnPressed: {
    backgroundColor: "#FDF2F2",
  },
});
