import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { EnergyBalanceCard } from "@/components/nutrition/EnergyBalanceCard";
import { EssentialPillarCard } from "@/components/nutrition/EssentialPillarCard";
import { GutHealthCard } from "@/components/nutrition/GutHealthCard";
import { HydrationPillarCard } from "@/components/nutrition/HydrationPillarCard";
import { LifePlateInsightCard } from "@/components/nutrition/LifePlateInsightCard";
import { NutritionScoreHero } from "@/components/nutrition/NutritionScoreHero";
import { SectionDivider } from "@/components/nutrition/shared";
import { WeeklyTrendsCard } from "@/components/nutrition/WeeklyTrendsCard";
import { WhatToEatNextCard } from "@/components/nutrition/WhatToEatNextCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { updateHydration } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { premiumStyles } from "@/src/theme/premium";
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
    <Screen scroll padded={false} loading={loading}>
      <PremiumHeader
        title="Insights"
        subtitle="Today's nutrition coach"
      />
      <View style={styles.body}>
        {dashboard ? (
          <>
            <NutritionScoreHero
              score={dashboard.score}
              scoreStatus={dashboard.scoreStatus}
              coachSummary={dashboard.coachSummary}
            />

            {!hasMealsToday ? (
              <Text variant="bodyMedium" style={premiumStyles.empty}>
                Log a meal to unlock today&apos;s full coach breakdown. Hydration tracking is available now.
              </Text>
            ) : null}

            <Text variant="titleSmall" style={styles.sectionHeading}>
              Essentials
            </Text>
            <EssentialPillarCard pillar={dashboard.essentials.protein} />
            <SectionDivider />
            <EssentialPillarCard pillar={dashboard.essentials.fibre} />
            <SectionDivider />
            <EssentialPillarCard pillar={dashboard.essentials.plants} />
            <SectionDivider />
            <HydrationPillarCard
              pillar={dashboard.essentials.hydration}
              updating={hydrationUpdating}
              onIncrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed + 1)
              }
              onDecrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed - 1)
              }
            />

            <EnergyBalanceCard
              carbs={dashboard.energyBalance.carbs}
              fats={dashboard.energyBalance.fats}
            />
            <GutHealthCard gutHealth={dashboard.gutHealth} />
            <WhatToEatNextCard
              items={dashboard.recommendations.items}
              impact={dashboard.recommendations.impact}
            />
            <WeeklyTrendsCard trends={dashboard.weeklyTrends} />
            <LifePlateInsightCard insight={dashboard.lifeplateInsight} />
          </>
        ) : null}

        {!loading && !dashboard ? (
          <Text variant="bodyMedium" style={premiumStyles.empty}>
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
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  sectionHeading: {
    opacity: 0.65,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
});
