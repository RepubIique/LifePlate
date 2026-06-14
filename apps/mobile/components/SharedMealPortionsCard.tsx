import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { clampMealPortions } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

const TOTAL_PORTION_OPTIONS = [2, 3, 4, 5, 6] as const;

type SharedMealPortionsCardProps = {
  totalPortions: number;
  portionsEaten: number;
  estimatedServings?: number;
  onTotalPortionsChange: (value: number) => void;
  onPortionsEatenChange: (value: number) => void;
};

function PortionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <PremiumCard noBlur style={[styles.chip, selected && styles.chipSelected]}>
        <Text variant="bodyMedium" style={selected ? styles.chipTextSelected : undefined}>
          {label}
        </Text>
      </PremiumCard>
    </Pressable>
  );
}

export function SharedMealPortionsCard({
  totalPortions,
  portionsEaten,
  estimatedServings,
  onTotalPortionsChange,
  onPortionsEatenChange,
}: SharedMealPortionsCardProps) {
  const eatenOptions = Array.from(
    { length: Math.min(totalPortions, 4) },
    (_, i) => i + 1,
  );

  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        Shared meal?
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {estimatedServings != null && estimatedServings >= 2
          ? `This looks like food for about ${Math.round(estimatedServings)} people.`
          : "This looks like more than one portion."}{" "}
        Tell us how many servings are in the photo so we log your share correctly.
      </Text>

      <Text variant="labelLarge" style={styles.sectionLabel}>
        How many portions is this for?
      </Text>
      <View style={styles.chipRow}>
        {TOTAL_PORTION_OPTIONS.map((n) => (
          <PortionChip
            key={n}
            label={String(n)}
            selected={totalPortions === n}
            onPress={() => {
              onTotalPortionsChange(n);
              if (portionsEaten > n) onPortionsEatenChange(n);
            }}
          />
        ))}
      </View>

      <Text variant="labelLarge" style={styles.sectionLabel}>
        How many did you eat?
      </Text>
      <View style={styles.chipRow}>
        {eatenOptions.map((n) => (
          <PortionChip
            key={n}
            label={n === 1 ? "1 portion" : `${n} portions`}
            selected={portionsEaten === n}
            onPress={() => onPortionsEatenChange(n)}
          />
        ))}
        {totalPortions > 4 ? (
          <PortionChip
            label={`${totalPortions} (all)`}
            selected={portionsEaten === totalPortions}
            onPress={() => onPortionsEatenChange(totalPortions)}
          />
        ) : null}
      </View>

      <Text variant="bodySmall" style={styles.hint}>
        Logging {clampMealPortions(portionsEaten)} of {clampMealPortions(totalPortions)}{" "}
        {totalPortions === 1 ? "portion" : "portions"}.
      </Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.7, marginTop: spacing.xs, lineHeight: 18 },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    opacity: 0.65,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 52,
    alignItems: "center",
  },
  chipSelected: {
    borderColor: "#1B4332",
    backgroundColor: "#F8FBF9",
  },
  chipTextSelected: { color: "#1B4332" },
  hint: { opacity: 0.65, marginTop: spacing.sm, lineHeight: 18 },
});
