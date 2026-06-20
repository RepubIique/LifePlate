import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { InsightsResponse } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { capitalize } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  insights: InsightsResponse;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="bodyMedium" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

export function WeekSummaryCard({ insights }: Props) {
  const commonFood = insights.mostCommonFood
    ? capitalize(insights.mostCommonFood)
    : "—";

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        {insights.period}
      </Text>
      <View style={styles.stats}>
        <StatRow label="Meals logged" value={String(insights.mealsLogged)} />
        <StatRow label="Plant foods" value={String(insights.vegetablesConsumed)} />
        <StatRow label="Protein average" value={`${insights.proteinAverage}g/day`} />
        <StatRow label="Most common" value={commonFood} />
      </View>
      <View style={styles.splitRow}>
        <View style={styles.splitCol}>
          <Text variant="labelLarge" style={styles.splitLabel}>
            Home cooked
          </Text>
          <Text variant="headlineSmall" style={styles.splitValue}>
            {insights.homeCookedPercent}%
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.splitCol}>
          <Text variant="labelLarge" style={styles.splitLabel}>
            Takeaway
          </Text>
          <Text variant="headlineSmall" style={[styles.splitValue, styles.takeaway]}>
            {insights.takeawayPercent}%
          </Text>
        </View>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { letterSpacing: 0.15, color: "#1B4332" },
  stats: { gap: spacing.sm },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statLabel: { opacity: 0.65, flex: 1 },
  statValue: { color: "#1B4332", letterSpacing: 0.1 },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBF9",
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  splitCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  splitLabel: {
    opacity: 0.5,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  splitValue: {
    fontWeight: "700",
    color: "#40916C",
    letterSpacing: -0.3,
  },
  takeaway: { color: "#E07A5F" },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "#DDE5E0",
  },
});
