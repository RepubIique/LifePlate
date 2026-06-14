import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NutritionDashboardView } from "@/lib/nutritionDashboardView";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { PillarMiniBar } from "./PillarMiniBar";
import { ScoreRing } from "@/components/ui/ScoreRing";

type Props = {
  dashboard: NutritionDashboardView;
  onPressInsights?: () => void;
};

export function TodayAtGlanceCard({ dashboard, onPressInsights }: Props) {
  const { score, scoreStatus, coachSummary, essentials } = dashboard;
  const hasMeals =
    essentials.protein.consumed > 0 ||
    essentials.fibre.consumed > 0 ||
    essentials.plants.consumed > 0;

  return (
    <Pressable onPress={onPressInsights} disabled={!onPressInsights}>
      <PremiumCard style={styles.card}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Today at a glance
          </Text>
          {onPressInsights ? (
            <View style={styles.link}>
              <Text variant="labelLarge" style={styles.linkText}>
                Insights
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#40916C" />
            </View>
          ) : null}
        </View>

        <View style={styles.heroRow}>
          <ScoreRing score={score} scoreStatus={scoreStatus} />
          <View style={styles.summaryCol}>
            <Text variant="labelLarge" style={styles.scoreCaption}>
              Nutrition score
            </Text>
            <Text variant="bodyMedium" style={styles.coach} numberOfLines={3}>
              {hasMeals
                ? `"${coachSummary}"`
                : "Log a meal to unlock your daily score and coach summary."}
            </Text>
          </View>
        </View>

        <View style={styles.pillars}>
          <PillarMiniBar pillar={essentials.protein} />
          <PillarMiniBar pillar={essentials.fibre} />
          <PillarMiniBar pillar={essentials.plants} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { letterSpacing: 0.15 },
  link: { flexDirection: "row", alignItems: "center", gap: 2 },
  linkText: { color: "#40916C", letterSpacing: 0.2 },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  summaryCol: { flex: 1, gap: spacing.xs },
  scoreCaption: {
    opacity: 0.55,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  coach: {
    lineHeight: 21,
    opacity: 0.85,
    fontStyle: "italic",
  },
  pillars: { gap: spacing.sm },
});
