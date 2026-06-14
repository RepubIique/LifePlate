import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import {
  getFilledSlots,
  getSuggestedSlot,
  MEAL_SLOTS,
} from "@/lib/mealSlots";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  meals: MealListSummary[];
  onLogSuggested?: () => void;
};

export function MealSlotsTracker({ meals, onLogSuggested }: Props) {
  const filled = getFilledSlots(meals);
  const suggested = getSuggestedSlot(filled);
  const filledCount = filled.size;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          Today&apos;s plates
        </Text>
        <Text variant="labelLarge" style={styles.count}>
          {filledCount}/{MEAL_SLOTS.length}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}
      >
        {MEAL_SLOTS.map((slot) => {
          const isFilled = filled.has(slot.key);
          const isSuggested = !isFilled && slot.key === suggested;

          return (
            <SlotChip
              key={slot.key}
              label={slot.label}
              icon={slot.icon}
              filled={isFilled}
              suggested={isSuggested}
              onPress={isSuggested ? onLogSuggested : undefined}
            />
          );
        })}
      </ScrollView>
    </PremiumCard>
  );
}

function SlotChip({
  label,
  icon,
  filled,
  suggested,
  onPress,
}: {
  label: string;
  icon: (typeof MEAL_SLOTS)[number]["icon"];
  filled: boolean;
  suggested: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={[
        styles.chip,
        filled && styles.chipFilled,
        suggested && styles.chipSuggested,
      ]}
    >
      <View style={[styles.iconWrap, filled && styles.iconWrapFilled]}>
        {filled ? (
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={suggested ? "#1B4332" : "#636E72"}
          />
        )}
      </View>
      <Text
        variant="labelMedium"
        style={[styles.chipLabel, filled && styles.chipLabelFilled]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { letterSpacing: 0.15 },
  count: { opacity: 0.5 },
  slots: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    alignItems: "center",
    gap: 6,
    minWidth: 72,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipFilled: {},
  chipSuggested: {
    backgroundColor: "#D8F3DC",
    borderColor: "#40916C",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F3F5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapFilled: {
    backgroundColor: "#40916C",
  },
  chipLabel: {
    opacity: 0.65,
    letterSpacing: 0.1,
  },
  chipLabelFilled: {
    opacity: 0.9,
    color: "#1B4332",
    fontWeight: "600",
  },
  pressed: { opacity: 0.85 },
});
