import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { WeeklyTrendItem } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  trends: WeeklyTrendItem[];
};

export function WeeklyTrendsCard({ trends }: Props) {
  if (trends.length === 0) return null;

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        Weekly trends
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        How your last 7 days are tracking against your targets.
      </Text>
      <View style={styles.list}>
        {trends.map((trend) => (
          <View key={trend.label} style={styles.row}>
            <Text variant="bodyLarge" style={styles.label}>
              {trend.label}
            </Text>
            <StatusBadge status={trend.status} />
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { letterSpacing: 0.15, color: semantic.primary },
  subtitle: { opacity: 0.55, lineHeight: 18 },
  list: { gap: spacing.sm, marginTop: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.trackBackground,
  },
  label: { flex: 1, letterSpacing: 0.1 },
});
