import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MEAL_TYPE_OPTIONS, type MealType } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type MealTypePickerProps = {
  value: MealType;
  onChange: (value: MealType) => void;
};

export function MealTypePicker({ value, onChange }: MealTypePickerProps) {
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
});
