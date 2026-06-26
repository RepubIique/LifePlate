import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { clampMealPortions } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

const TOTAL_PORTION_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

type SharedMealPortionsCardProps = {
  totalPortions: number;
  portionsEaten: number;
  variant?: "confirm" | "edit";
  embedded?: boolean;
  onTotalPortionsChange: (value: number) => void;
  onPortionsEatenChange: (value: number) => void;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
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
      borderColor: semantic.primary,
      backgroundColor: ui.cardBackground,
    },
    chipTextSelected: { color: semantic.primary },
    hint: { opacity: 0.65, marginTop: spacing.sm, lineHeight: 18 },
    embedded: { gap: spacing.xs },
    sectionLabelFirst: { marginTop: 0 },
  });
}

function PortionChip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
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
  variant = "confirm",
  embedded = false,
  onTotalPortionsChange,
  onPortionsEatenChange,
}: SharedMealPortionsCardProps) {
  const styles = useThemedStyles(createStyles);
  const eatenOptions = Array.from(
    { length: Math.min(totalPortions, 4) },
    (_, i) => i + 1,
  );

  const title = variant === "edit" ? "Portions" : "Shared meal?";
  const subtitle =
    variant === "edit"
      ? embedded
        ? "Split this meal if you shared it or only ate part of it."
        : "Update how this meal was split if you shared it or only ate part of it."
      : "Split this meal if you shared it or only ate part of it.";

  const content = (
    <>
      {!embedded ? (
        <>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {subtitle}
          </Text>
        </>
      ) : null}

      <Text variant="labelLarge" style={[styles.sectionLabel, embedded && styles.sectionLabelFirst]}>
        How many portions is this for?
      </Text>
      <View style={styles.chipRow}>
        {TOTAL_PORTION_OPTIONS.map((n) => (
          <PortionChip
            key={n}
            label={n === 1 ? "1 portion" : String(n)}
            selected={totalPortions === n}
            onPress={() => {
              onTotalPortionsChange(n);
              onPortionsEatenChange(n === 1 ? 1 : Math.min(portionsEaten, n));
            }}
            styles={styles}
          />
        ))}
      </View>

      {totalPortions > 1 ? (
        <>
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
            styles={styles}
          />
        ))}
        {totalPortions > 4 ? (
          <PortionChip
            label={`${totalPortions} (all)`}
            selected={portionsEaten === totalPortions}
            onPress={() => onPortionsEatenChange(totalPortions)}
            styles={styles}
          />
        ) : null}
      </View>
        </>
      ) : null}

      <Text variant="bodySmall" style={styles.hint}>
        Logging {clampMealPortions(portionsEaten)} of {clampMealPortions(totalPortions)}{" "}
        {totalPortions === 1 ? "portion" : "portions"}.
      </Text>
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{content}</View>;
  }

  return <PremiumCard>{content}</PremiumCard>;
}
