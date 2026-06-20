import { Pressable, StyleSheet, View } from "react-native";
import { SegmentedButtons, Text } from "react-native-paper";
import { MEAL_SOURCE_OPTIONS, type MealSource } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type MealSourcePickerProps = {
  value: MealSource;
  onChange: (value: MealSource) => void;
  compact?: boolean;
};

export function MealSourcePicker({ value, onChange, compact = false }: MealSourcePickerProps) {
  if (compact) {
    return (
      <View style={styles.compactRoot}>
        <Text variant="labelLarge" style={styles.compactLabel}>
          Source
        </Text>
        <SegmentedButtons
          value={value}
          onValueChange={(next) => onChange(next as MealSource)}
          buttons={MEAL_SOURCE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.segmented}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text variant="titleMedium" style={styles.title}>
        Meal source
      </Text>
      <View style={styles.grid}>
        {MEAL_SOURCE_OPTIONS.map((option) => {
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

const styles = StyleSheet.create({
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
    borderColor: "#1B4332",
    backgroundColor: "#F8FBF9",
  },
  textSelected: { color: "#1B4332" },
  compactRoot: { gap: spacing.xs },
  compactLabel: {
    opacity: 0.55,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  segmented: { alignSelf: "stretch" },
});
