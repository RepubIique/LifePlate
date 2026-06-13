import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { WeeklyTrendItem } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { statusEmoji } from "./shared";

type Props = {
  trends: WeeklyTrendItem[];
};

function trendLabel(status: WeeklyTrendItem["status"]): string {
  if (status === "on_track") return "On Track";
  if (status === "moderate") return "Moderate";
  return "Needs Improvement";
}

export function WeeklyTrendsCard({ trends }: Props) {
  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        Weekly Trends
      </Text>
      <View style={styles.list}>
        {trends.map((trend) => (
          <View key={trend.label} style={styles.row}>
            <Text variant="bodyLarge" style={styles.label}>
              {trend.label}
            </Text>
            <Text variant="bodyMedium" style={styles.status}>
              {statusEmoji(trend.status)} {trendLabel(trend.status)}
            </Text>
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15, marginBottom: spacing.sm },
  list: { gap: spacing.md },
  row: { gap: 2 },
  label: { letterSpacing: 0.1 },
  status: { opacity: 0.8 },
});
