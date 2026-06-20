import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
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
  isLast: boolean;
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

export function TimelineMealCard({ meal, isLast, onPress, onDelete }: Props) {
  const icon = mealTypeIcon(meal.mealType);
  const typeLabel = formatMealTypeLabel(meal.mealType);
  const time = formatMealTime(meal.createdAt);

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <View style={styles.cardWrap}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          <PremiumCard style={styles.card} noBlur>
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
          </PremiumCard>
        </Pressable>

        {onDelete ? (
          <IconButton
            icon="delete-outline"
            size={18}
            iconColor="#636E72"
            style={styles.delete}
            onPress={onDelete}
            accessibilityLabel="Delete meal"
          />
        ) : null}
      </View>
    </View>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rail: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#40916C",
    marginTop: THUMB / 2 - 5,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8E4",
    marginTop: 4,
    marginBottom: -spacing.sm,
    borderRadius: 1,
  },
  cardWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
  },
  pressable: { flex: 1 },
  pressed: { opacity: 0.92 },
  card: {
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
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
  delete: {
    margin: 0,
    marginTop: spacing.sm,
  },
});
