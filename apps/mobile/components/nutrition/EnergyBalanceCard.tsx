import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { EnergyMetric } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { NutritionIcon } from "@/components/icons/NutritionIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList } from "./shared";

type Props = {
  carbs: EnergyMetric;
  fats: EnergyMetric;
};

function energyStatusLabel(status: EnergyMetric["status"]): string {
  if (status === "good") return "Balanced";
  if (status === "moderate") return "Moderate";
  return "Low";
}

function EnergyMetricCard({ metric }: { metric: EnergyMetric }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <NutritionIcon
          icon={metric.icon}
          emoji={(metric as { emoji?: string }).emoji}
          size={36}
          variant="badge"
        />
        <View style={styles.metricTitle}>
          <Text variant="titleSmall" style={styles.label}>
            {metric.label}
          </Text>
          <Text variant="headlineSmall" style={styles.grams}>
            {metric.grams}g
          </Text>
        </View>
        <StatusBadge status={metric.status} label={energyStatusLabel(metric.status)} />
      </View>
      <Text variant="bodySmall" style={styles.description}>
        {metric.description}
      </Text>
      {metric.equivalents.length > 0 ? (
        <View style={styles.equiv}>
          <Text variant="labelMedium" style={styles.equivLabel}>
            Equivalent to
          </Text>
          <BulletList items={metric.equivalents.slice(0, 2)} />
        </View>
      ) : null}
    </View>
  );
}

export function EnergyBalanceCard({ carbs, fats }: Props) {
  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        Energy balance
      </Text>
      <View style={styles.grid}>
        <EnergyMetricCard metric={carbs} />
        <EnergyMetricCard metric={fats} />
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { letterSpacing: 0.15 },
  grid: { gap: spacing.sm },
  metricCard: {
    backgroundColor: "#F8FBF9",
    borderRadius: 14,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metricTitle: { flex: 1 },
  label: { opacity: 0.65, letterSpacing: 0.2 },
  grams: { fontWeight: "700", letterSpacing: -0.3 },
  description: { opacity: 0.7, lineHeight: 18 },
  equiv: { marginTop: spacing.xs, gap: 2 },
  equivLabel: { opacity: 0.45, letterSpacing: 0.6, textTransform: "uppercase" },
});
