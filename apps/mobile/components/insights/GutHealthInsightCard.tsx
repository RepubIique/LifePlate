import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { GutHealthSummary, TrendStatus } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { FoodChips } from "@/components/nutrition/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  gutHealth: GutHealthSummary;
  periodGutStatus?: TrendStatus;
  periodGutLabel?: string;
};

export function GutHealthInsightCard({ gutHealth, periodGutStatus, periodGutLabel }: Props) {
  const hasFoods =
    gutHealth.fermentedFoods.length > 0 || gutHealth.prebioticFoods.length > 0;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Text variant="titleMedium" style={styles.title}>
            Gut health
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Fermented and prebiotic foods support your microbiome.
          </Text>
        </View>
        <View style={styles.scoreCol}>
          <Text variant="headlineMedium" style={styles.score}>
            {gutHealth.score}
          </Text>
          <Text variant="labelSmall" style={styles.scoreCaption}>
            / 10 today
          </Text>
        </View>
      </View>

      <View style={styles.badges}>
        <View style={styles.badgeRow}>
          <Text variant="labelSmall" style={styles.badgeHint}>
            Today
          </Text>
          <StatusBadge status={gutHealth.status} />
        </View>
        {periodGutStatus && periodGutLabel ? (
          <View style={styles.badgeRow}>
            <Text variant="labelSmall" style={styles.badgeHint}>
              {periodGutLabel}
            </Text>
            <StatusBadge status={periodGutStatus} />
          </View>
        ) : null}
      </View>

      {hasFoods ? (
        <>
          {gutHealth.fermentedFoods.length > 0 ? (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Fermented
              </Text>
              <FoodChips items={gutHealth.fermentedFoods} />
            </View>
          ) : null}
          {gutHealth.prebioticFoods.length > 0 ? (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Prebiotic
              </Text>
              <FoodChips items={gutHealth.prebioticFoods} />
            </View>
          ) : null}
        </>
      ) : (
        <Text variant="bodyMedium" style={styles.empty}>
          No fermented or prebiotic foods logged today. Try yoghurt, kimchi, garlic, or oats.
        </Text>
      )}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleCol: { flex: 1, gap: 4 },
  title: { letterSpacing: 0.15, color: semantic.primary },
  subtitle: { opacity: 0.55, lineHeight: 18 },
  scoreCol: { alignItems: "center", minWidth: 52 },
  score: { fontWeight: "700", color: semantic.primary, letterSpacing: -0.5 },
  scoreCaption: { opacity: 0.45 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeHint: {
    opacity: 0.45,
    letterSpacing: 0.2,
  },
  section: { gap: spacing.xs },
  sectionLabel: {
    opacity: 0.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  empty: {
    opacity: 0.65,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
