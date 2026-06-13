import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import type { InsightsResponse } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { fetchInsights } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { premiumStyles } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="bodyMedium" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="titleLarge" style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <PremiumCard>
      <Text variant="bodySmall" style={styles.miniLabel}>
        {label}
      </Text>
      <Text variant="headlineSmall" style={styles.miniValue}>
        {value}
      </Text>
    </PremiumCard>
  );
}

export default function InsightsScreen() {
  const { profile } = useAuth();
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInsights()
        .then(setInsights)
        .catch((e) => {
          setInsights(null);
          setSnackbar(friendlyErrorMessage(e));
        })
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen scroll padded={false} loading={loading}>
      <PremiumHeader
        title="Insights"
        subtitle={insights?.period ?? "This week at a glance"}
      />
      <View style={styles.body}>
        <View style={styles.miniGrid}>
          <MiniCard label="Current streak" value={`${profile?.currentStreak ?? 0} days`} />
          <MiniCard
            label="Longest streak"
            value={`${profile?.longestStreak ?? 0} days`}
          />
        </View>
        {insights?.coachNudge ? (
          <PremiumCard>
            <Text variant="labelLarge" style={styles.coachLabel}>
              This week
            </Text>
            <Text variant="bodyLarge" style={styles.coachText}>
              {insights.coachNudge}
            </Text>
          </PremiumCard>
        ) : null}
        {insights ? (
          <PremiumCard>
            <StatRow label="Meals logged" value={String(insights.mealsLogged)} />
            <StatRow label="Vegetables" value={String(insights.vegetablesConsumed)} />
            <StatRow label="Protein average" value={`${insights.proteinAverage}g / day`} />
            <StatRow label="Most common" value={insights.mostCommonFood ?? "—"} />
            <StatRow label="Home cooked" value={`${insights.homeCookedPercent}%`} />
            <StatRow label="Takeaway" value={`${insights.takeawayPercent}%`} />
          </PremiumCard>
        ) : null}
        {!loading && !insights ? (
          <Text variant="bodyMedium" style={premiumStyles.empty}>
            Log a few meals to see your patterns.
          </Text>
        ) : null}
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  miniGrid: { flexDirection: "row", gap: spacing.md },
  miniLabel: { opacity: 0.65, letterSpacing: 0.2 },
  miniValue: { marginTop: spacing.xs, letterSpacing: 0.2 },
  coachLabel: { opacity: 0.55, letterSpacing: 0.8, textTransform: "uppercase" },
  coachText: { marginTop: spacing.xs, lineHeight: 24 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  statLabel: { opacity: 0.75 },
  statValue: { letterSpacing: 0.1 },
});
