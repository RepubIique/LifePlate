import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import type { ComparisonPeriod, PeriodComparison, WeeklyTrendItem } from "@lifeplate/shared";
import { mealLogDateKey, offsetLogDateKey } from "@lifeplate/shared";
import { GutHealthInsightCard } from "@/components/insights/GutHealthInsightCard";
import { InsightsStreakCard } from "@/components/insights/InsightsStreakCard";
import { PeriodComparisonCard } from "@/components/insights/PeriodComparisonCard";
import { PeriodSelector } from "@/components/insights/PeriodSelector";
import { RecommendationsCard } from "@/components/insights/RecommendationsCard";
import { WeekSummaryCard } from "@/components/insights/WeekSummaryCard";
import { WeeklyTrendsCard } from "@/components/insights/WeeklyTrendsCard";
import { LifePlateInsightCard } from "@/components/nutrition/LifePlateInsightCard";
import { InsightsSkeleton } from "@/components/skeletons/InsightsSkeleton";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useWeekInsights } from "@/context/WeekInsightsContext";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { currentWeekStartKey } from "@/lib/weekInsightsWindow";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

const PERIOD_SECTION: Record<ComparisonPeriod, { title: string; subtitle: string }> = {
  day: { title: "Today", subtitle: "Compared with yesterday" },
  week: { title: "This week", subtitle: "Compared with last week" },
  month: { title: "This month", subtitle: "Compared with last month" },
};

function trendsForPeriod(
  dashboard: NonNullable<ReturnType<typeof useNutritionDashboard>["dashboard"]>,
  period: ComparisonPeriod,
): WeeklyTrendItem[] {
  if (period === "day") return dashboard.dayTrends ?? [];
  if (period === "month") return dashboard.monthTrends ?? [];
  return dashboard.weeklyTrends ?? [];
}

function comparisonForPeriod(
  dashboard: NonNullable<ReturnType<typeof useNutritionDashboard>["dashboard"]>,
  period: ComparisonPeriod,
): PeriodComparison {
  if (period === "week") return dashboard.weekComparison ?? dashboard.comparison;
  if (period === "month") return dashboard.monthComparison ?? dashboard.comparison;
  return dashboard.comparison;
}

const PERIOD_GUT_LABEL: Record<ComparisonPeriod, string | null> = {
  day: null,
  week: "This week",
  month: "This month",
};

export default function InsightsScreen() {
  const { profile } = useAuth();
  const { meals } = useMeals();
  const {
    dashboard,
    loading: dashboardLoading,
    refreshing: dashboardRefreshing,
    loadDashboard,
    refreshDashboard,
  } = useNutritionDashboard();
  const {
    insights: weekInsights,
    loading: weekLoading,
    refreshing: weekRefreshing,
    loadWeekInsights,
    refreshWeekInsights,
  } = useWeekInsights();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [period, setPeriod] = useState<ComparisonPeriod>("day");

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
      void loadWeekInsights();
    }, [loadDashboard, loadWeekInsights]),
  );

  const showDashboardSkeleton = dashboardLoading && !dashboard;
  const showWeekSkeleton = weekLoading && !weekInsights;

  const handleRefresh = useCallback(() => {
    void Promise.all([refreshDashboard(), refreshWeekInsights()]).catch((e) =>
      setSnackbar(friendlyErrorMessage(e)),
    );
  }, [refreshDashboard, refreshWeekInsights]);

  const activeTrends = dashboard ? trendsForPeriod(dashboard, period) : [];
  const periodGutStatus = activeTrends.find((t) => t.label === "Gut Health")?.status;
  const periodGutLabel = PERIOD_GUT_LABEL[period];

  const mealsLastWeek = useMemo(() => {
    const thisWeekStart = currentWeekStartKey();
    const lastWeekStart = offsetLogDateKey(thisWeekStart, -7);
    const lastWeekEnd = offsetLogDateKey(thisWeekStart, -1);
    return meals.filter((meal) => {
      const key = mealLogDateKey(meal);
      return key >= lastWeekStart && key <= lastWeekEnd;
    }).length;
  }, [meals]);

  const periodSection = PERIOD_SECTION[period];
  const activeComparison = dashboard ? comparisonForPeriod(dashboard, period) : null;

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={dashboardRefreshing || weekRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      <PremiumHeader
        title="Insights"
        subtitle="See how you're tracking over time"
      />
      <View style={styles.body}>
        {showDashboardSkeleton ? (
          <InsightsSkeleton />
        ) : dashboard ? (
          <>
            <SectionLabel title={periodSection.title} subtitle={periodSection.subtitle} />
            <PeriodSelector value={period} onChange={setPeriod} />

            {activeComparison ? (
              <PeriodComparisonCard comparison={activeComparison} />
            ) : null}

            <SectionLabel title="This week" subtitle="Your last 7 days" />

            {showWeekSkeleton ? (
              <PremiumCard noBlur style={styles.weekSkeleton}>
                <Skeleton width="40%" height={20} />
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={styles.weekSkeletonRow}>
                    <Skeleton width="55%" height={14} />
                    <Skeleton width={72} height={18} />
                  </View>
                ))}
              </PremiumCard>
            ) : weekInsights ? (
              <WeekSummaryCard insights={weekInsights} />
            ) : null}

            <WeeklyTrendsCard trends={activeTrends} period={period} />

            <GutHealthInsightCard
              gutHealth={dashboard.gutHealth}
              periodGutStatus={periodGutStatus}
              periodGutLabel={periodGutLabel ?? undefined}
            />

            <RecommendationsCard recommendations={dashboard.recommendations} />

            <InsightsStreakCard
              currentStreak={profile?.currentStreak ?? 0}
              longestStreak={profile?.longestStreak ?? 0}
              mealsThisWeek={weekInsights?.mealsLogged ?? 0}
              mealsLastWeek={mealsLastWeek}
            />

            <SectionLabel title="Coach" />
            <LifePlateInsightCard insight={dashboard.lifeplateInsight} />
          </>
        ) : null}

        {!showDashboardSkeleton && !dashboard ? (
          <PremiumCard style={styles.emptyCard} noBlur>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="chart-line" size={28} color={semantic.primary} />
            </View>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Insights unlock as you log
            </Text>
            <Text variant="bodyMedium" style={styles.empty}>
              Log a few meals to see how today compares to yesterday and get personalised nudges.
            </Text>
          </PremiumCard>
        ) : null}
      </View>

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  weekSkeleton: {
    gap: spacing.md,
  },
  weekSkeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    backgroundColor: ui.cardBackground,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ui.selectedBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: semantic.primary,
    textAlign: "center",
    letterSpacing: 0.15,
  },
  empty: {
    opacity: 0.65,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
});
