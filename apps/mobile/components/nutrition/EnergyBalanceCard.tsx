import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { EnergyMetric } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList, statusEmoji } from "./shared";

type Props = {
  carbs: EnergyMetric;
  fats: EnergyMetric;
};

function EnergyRow({ metric }: { metric: EnergyMetric }) {
  return (
    <View style={styles.metric}>
      <Text variant="titleMedium">
        {metric.emoji} {metric.label}
      </Text>
      <Text variant="headlineSmall" style={styles.grams}>
        {metric.grams}g
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {metric.description}
      </Text>
      <Text variant="bodyMedium" style={styles.status}>
        Status: {statusEmoji(metric.status)} {metric.status === "good" ? "Good" : metric.status === "moderate" ? "Balanced" : "Low"}
      </Text>
      <View style={styles.equiv}>
        <Text variant="labelLarge" style={styles.equivLabel}>
          Equivalent to
        </Text>
        <BulletList items={metric.equivalents} />
      </View>
    </View>
  );
}

export function EnergyBalanceCard({ carbs, fats }: Props) {
  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        Energy Balance
      </Text>
      <EnergyRow metric={carbs} />
      <View style={styles.divider} />
      <EnergyRow metric={fats} />
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15, marginBottom: spacing.sm },
  metric: { gap: spacing.xs },
  grams: { letterSpacing: 0.1 },
  description: { opacity: 0.75, lineHeight: 20 },
  status: { opacity: 0.85 },
  equiv: { marginTop: spacing.sm, gap: spacing.xs },
  equivLabel: { opacity: 0.55, letterSpacing: 0.6, textTransform: "uppercase" },
  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginVertical: spacing.md,
  },
});
