import { Pressable, StyleSheet, View } from "react-native";
import { SegmentedButtons, Text } from "react-native-paper";
import { MEAL_SOURCE_OPTIONS, type MealSource } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type MealSourcePickerProps = {
  value: MealSource | null;
  onChange: (value: MealSource | null) => void;
  compact?: boolean;
  optional?: boolean;
};

function handleSourcePress(
  option: (typeof MEAL_SOURCE_OPTIONS)[number],
  value: MealSource | null,
  optional: boolean,
  onChange: (value: MealSource | null) => void,
) {
  if (optional && value === option.value) {
    onChange(null);
    return;
  }
  onChange(option.value);
}

export function MealSourcePicker({
  value,
  onChange,
  compact = false,
  optional = false,
}: MealSourcePickerProps) {
  if (compact) {
    return (
      <View style={styles.compactRoot}>
        <Text variant="labelLarge" style={styles.compactLabel}>
          Source
        </Text>
        {optional ? (
          <View style={styles.compactRow}>
            {MEAL_SOURCE_OPTIONS.map((option) => {
              const selected = value === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.compactOption, selected && styles.compactOptionSelected]}
                  onPress={() => handleSourcePress(option, value, optional, onChange)}
                >
                  <Text
                    variant="labelLarge"
                    style={selected ? styles.compactTextSelected : styles.compactText}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <SegmentedButtons
            value={value ?? MEAL_SOURCE_OPTIONS[0].value}
            onValueChange={(next) => onChange(next as MealSource)}
            buttons={MEAL_SOURCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            style={styles.segmented}
          />
        )}
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
              onPress={() => handleSourcePress(option, value, optional, onChange)}
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
  segmented: { alignSelf: "stretch" },
  compactRow: { flexDirection: "row", gap: spacing.xs },
  compactOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  compactOptionSelected: {
    borderColor: semantic.primary,
    backgroundColor: ui.cardBackground,
  },
  compactText: { opacity: 0.7 },
  compactTextSelected: { color: semantic.primary },
});
