import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import type { ComparisonPeriod } from "@lifeplate/shared";
import { PeriodComparisonCard } from "@/components/insights/PeriodComparisonCard";
import { PeriodSelector } from "@/components/insights/PeriodSelector";
import { LifePlateInsightCard } from "@/components/nutrition/LifePlateInsightCard";
import { InsightsSkeleton } from "@/components/skeletons/InsightsSkeleton";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { spacing } from "@/src/theme/lifeplate";

export default function InsightsScreen() {
  const { dashboard, loading, refreshing, refreshDashboard } = useNutritionDashboard();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [period, setPeriod] = useState<ComparisonPeriod>("day");

  const handleRefresh = useCallback(() => {
    void refreshDashboard().catch((e) => setSnackbar(friendlyErrorMessage(e)));
  }, [refreshDashboard]);

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <PremiumHeader
        title="Insights"
        subtitle="See how you're tracking over time"
      />
      <View style={styles.body}>
        {loading && !dashboard ? (
          <InsightsSkeleton />
        ) : dashboard ? (
          <>
            <PeriodSelector value={period} onChange={setPeriod} />

            {period === "day" ? (
              <PeriodComparisonCard comparison={dashboard.comparison} />
            ) : (
              <Text variant="bodyMedium" style={styles.comingSoon}>
                {period === "week" ? "Weekly" : "Monthly"} comparisons are coming soon.
              </Text>
            )}

            <LifePlateInsightCard insight={dashboard.lifeplateInsight} />
          </>
        ) : null}

        {!loading && !dashboard ? (
          <Text variant="bodyMedium" style={styles.empty}>
            Log a few meals to see how today compares to yesterday.
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
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  comingSoon: {
    opacity: 0.6,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  empty: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
