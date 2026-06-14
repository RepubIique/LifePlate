import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { WeeklyTrendItem } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  trends: WeeklyTrendItem[];
};

function trendLabel(status: WeeklyTrendItem["status"]): string {
  if (status === "on_track") return "On track";
  if (status === "moderate") return "Moderate";
  return "Needs work";
}

export function WeeklyTrendsCard({ trends }: Props) {
  if (trends.length === 0) return null;

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        Weekly trends
      </Text>
      <View style={styles.list}>
        {trends.map((trend) => (
          <View key={trend.label} style={styles.row}>
            <Text variant="bodyLarge" style={styles.label}>
              {trend.label}
            </Text>
            <StatusBadge status={trend.status} label={trendLabel(trend.status)} />
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { letterSpacing: 0.15 },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: "#F8FBF9",
    borderRadius: 12,
  },
  label: { flex: 1, letterSpacing: 0.1 },
});
