import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MEAL_TYPE_OPTIONS, type MealType } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type MealTypePickerProps = {
  value: MealType;
  onChange: (value: MealType) => void;
  compact?: boolean;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    root: { gap: spacing.xs },
    title: { letterSpacing: 0.15 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    option: { flexBasis: "48%", flexGrow: 1 },
    card: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: "center",
    },
    cardSelected: {
      borderColor: semantic.primary,
      backgroundColor: ui.cardBackground,
    },
    textSelected: { color: semantic.primary },
    compactRoot: { gap: spacing.xs },
    compactLabel: {
      opacity: 0.55,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    compactScroll: { gap: spacing.xs, paddingRight: spacing.sm },
    compactChip: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: ui.borderSubtle,
      backgroundColor: ui.pickerSurface,
    },
    compactChipSelected: {
      borderColor: semantic.primary,
      backgroundColor: ui.cardBackground,
    },
    compactChipText: { color: semantic.textMuted },
    compactChipTextSelected: { color: semantic.primary },
  });
}

export function MealTypePicker({ value, onChange, compact = false }: MealTypePickerProps) {
  const styles = useThemedStyles(createStyles);

  if (compact) {
    return (
      <View style={styles.compactRoot}>
        <Text variant="labelLarge" style={styles.compactLabel}>
          Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
        >
          {MEAL_TYPE_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <Pressable key={option.value} onPress={() => onChange(option.value)}>
                <View style={[styles.compactChip, selected && styles.compactChipSelected]}>
                  <Text
                    variant="bodySmall"
                    style={selected ? styles.compactChipTextSelected : styles.compactChipText}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text variant="titleMedium" style={styles.title}>
        Meal type
      </Text>
      <View style={styles.grid}>
        {MEAL_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={styles.option}
              onPress={() => onChange(option.value)}
            >
              <PremiumCard
                noBlur
                style={[styles.card, selected && styles.cardSelected]}
              >
                <Text
                  variant="bodyMedium"
                  style={selected ? styles.textSelected : undefined}
                >
                  {option.label}
                </Text>
              </PremiumCard>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
