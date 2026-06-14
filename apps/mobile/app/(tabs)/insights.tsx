import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { EnergyBalanceCard } from "@/components/nutrition/EnergyBalanceCard";
import { EssentialPillarCard } from "@/components/nutrition/EssentialPillarCard";
import { GutHealthCard } from "@/components/nutrition/GutHealthCard";
import { LifePlateInsightCard } from "@/components/nutrition/LifePlateInsightCard";
import { NutritionScoreHero } from "@/components/nutrition/NutritionScoreHero";
import { WeeklyTrendsCard } from "@/components/nutrition/WeeklyTrendsCard";
import { WhatToEatNextCard } from "@/components/nutrition/WhatToEatNextCard";
import { HydrationQuickAdd } from "@/components/home/HydrationQuickAdd";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { updateHydration } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { spacing } from "@/src/theme/lifeplate";

export default function InsightsScreen() {
  const { dashboard, loading, loadDashboard, patchHydration } = useNutritionDashboard();
  const [hydrationUpdating, setHydrationUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadDashboard]),
  );

  async function changeHydration(nextGlasses: number) {
    if (!dashboard) return;
    setHydrationUpdating(true);
    try {
      const { glasses } = await updateHydration(nextGlasses);
      patchHydration(glasses);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setHydrationUpdating(false);
    }
  }

  const hasMealsToday =
    dashboard != null &&
    (dashboard.essentials.protein.consumed > 0 ||
      dashboard.essentials.fibre.consumed > 0);

  return (
    <Screen scroll padded={false} loading={loading && !dashboard}>
      <PremiumHeader
        title="Insights"
        subtitle="Your nutrition coach for today"
      />
      <View style={styles.body}>
        {dashboard ? (
          <>
            <NutritionScoreHero
              score={dashboard.score}
              scoreStatus={dashboard.scoreStatus}
              coachSummary={dashboard.coachSummary}
              hasMeals={hasMealsToday}
            />

            <SectionLabel title="Essentials" subtitle="Core nutrients to track daily" />
            <EssentialPillarCard pillar={dashboard.essentials.protein} />
            <EssentialPillarCard pillar={dashboard.essentials.fibre} />
            <EssentialPillarCard pillar={dashboard.essentials.plants} />
            <HydrationQuickAdd
              pillar={dashboard.essentials.hydration}
              updating={hydrationUpdating}
              onIncrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed + 1)
              }
              onDecrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed - 1)
              }
            />

            {hasMealsToday ? (
              <>
                <SectionLabel title="Coach" subtitle="Personalised guidance" />
                <WhatToEatNextCard
                  items={dashboard.recommendations.items}
                  impact={dashboard.recommendations.impact}
                />
                <EnergyBalanceCard
                  carbs={dashboard.energyBalance.carbs}
                  fats={dashboard.energyBalance.fats}
                />
                <GutHealthCard gutHealth={dashboard.gutHealth} />
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.hint}>
                Log a meal to unlock energy balance, gut health, and personalised recommendations.
              </Text>
            )}

            <SectionLabel title="Your week" />
            <WeeklyTrendsCard trends={dashboard.weeklyTrends} />
            <LifePlateInsightCard insight={dashboard.lifeplateInsight} />
          </>
        ) : null}

        {!loading && !dashboard ? (
          <Text variant="bodyMedium" style={styles.empty}>
            Log a few meals to see your coach dashboard.
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
  hint: {
    opacity: 0.6,
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
  empty: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
