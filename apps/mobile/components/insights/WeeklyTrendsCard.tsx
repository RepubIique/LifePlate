import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ComparisonPeriod } from "@lifeplate/shared";
import type { WeeklyTrendItem } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  trends: WeeklyTrendItem[];
  period: ComparisonPeriod;
};

const PERIOD_COPY: Record<ComparisonPeriod, { title: string; subtitle: string }> = {
  day: {
    title: "Today's trends",
    subtitle: "How today is tracking against your targets.",
  },
  week: {
    title: "Weekly trends",
    subtitle: "How your last 7 days are tracking against your targets.",
  },
  month: {
    title: "Monthly trends",
    subtitle: "How this month is tracking against your targets.",
  },
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
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
}

export function WeeklyTrendsCard({ trends, period }: Props) {
  const styles = useThemedStyles(createStyles);

  if (trends.length === 0) return null;

  const copy = PERIOD_COPY[period];

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        {copy.title}
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {copy.subtitle}
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
