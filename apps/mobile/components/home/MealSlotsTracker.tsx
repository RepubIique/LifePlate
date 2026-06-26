import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { MealListSummary } from "@lifeplate/shared";
import { areCorePlatesComplete } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import {
  getFilledSlots,
  getSuggestedSlot,
  MEAL_SLOTS,
} from "@/lib/mealSlots";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  meals: MealListSummary[];
  title?: string;
  onLogSuggested?: () => void;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: spacing.sm },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { letterSpacing: 0.15 },
    count: { opacity: 0.5 },
    completeBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: ui.selectedBackground,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    completeText: {
      flex: 1,
      color: semantic.primary,
      opacity: 0.85,
      lineHeight: 18,
    },
    slots: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingVertical: 2,
    },
    slot: {
      flex: 1,
    },
    chip: {
      alignItems: "center",
      gap: 6,
      width: "100%",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "transparent",
    },
    chipFilled: {},
    chipSuggested: {
      backgroundColor: ui.selectedBackground,
      borderColor: semantic.primary,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ui.trackBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapFilled: {
      backgroundColor: semantic.primary,
    },
    chipLabel: {
      opacity: 0.65,
      letterSpacing: 0.1,
    },
    chipLabelFilled: {
      opacity: 0.9,
      color: semantic.primary,
      fontWeight: "600",
    },
    pressed: { opacity: 0.85 },
  });
}

export function MealSlotsTracker({ meals, title = "Today's plates", onLogSuggested }: Props) {
  const { semantic } = useAppColors();
  const styles = useThemedStyles(createStyles);
  const filled = getFilledSlots(meals);
  const suggested = getSuggestedSlot(filled);
  const filledCount = filled.size;
  const coreComplete = areCorePlatesComplete(filled);
  const wasCompleteRef = useRef(coreComplete);

  useEffect(() => {
    if (coreComplete && !wasCompleteRef.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasCompleteRef.current = coreComplete;
  }, [coreComplete]);

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="labelLarge" style={styles.count}>
          {filledCount}/{MEAL_SLOTS.length}
        </Text>
      </View>

      {coreComplete ? (
        <View style={styles.completeBanner}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={semantic.primary} />
          <Text variant="bodySmall" style={styles.completeText}>
            Breakfast, lunch & dinner logged — nice work today.
          </Text>
        </View>
      ) : null}

      <View style={styles.slots}>
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
              styles={styles}
            />
          );
        })}
      </View>
    </PremiumCard>
  );
}

function SlotChip({
  label,
  icon,
  filled,
  suggested,
  onPress,
  styles,
}: {
  label: string;
  icon: (typeof MEAL_SLOTS)[number]["icon"];
  filled: boolean;
  suggested: boolean;
  onPress?: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { semantic, ui } = useAppColors();

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
          <MaterialCommunityIcons name="check" size={16} color={ui.iconOnPrimary} />
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={suggested ? semantic.primary : semantic.textMuted}
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
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.slot}>{content}</View>;
}
