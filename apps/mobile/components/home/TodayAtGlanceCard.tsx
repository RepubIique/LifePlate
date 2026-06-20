import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NutritionDashboardView } from "@/lib/nutritionDashboardView";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { DigitalPlate } from "./DigitalPlate";

type Props = {
  dashboard: NutritionDashboardView;
  title?: string;
  onPressInsights?: () => void;
};

export function TodayAtGlanceCard({
  dashboard,
  title = "Today at a glance",
  onPressInsights,
}: Props) {
  const { score, coachSummary, essentials } = dashboard;
  const hasActivity =
    essentials.protein.consumed > 0 ||
    essentials.fibre.consumed > 0 ||
    essentials.plants.consumed > 0 ||
    essentials.carbs.consumed > 0 ||
    essentials.hydration.consumed > 0;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        {onPressInsights ? (
          <Pressable onPress={onPressInsights} style={styles.link} hitSlop={8}>
            <Text variant="labelLarge" style={styles.linkText}>
              Insights
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#40916C" />
          </Pressable>
        ) : null}
      </View>

        <DigitalPlate
          protein={essentials.protein}
          fibre={essentials.fibre}
          plants={essentials.plants}
          carbs={essentials.carbs}
          nutritionScore={score}
          hasMeals={hasActivity}
        />

        {hasActivity && coachSummary ? (
          <View style={styles.coachWrap}>
            <Text variant="bodyMedium" style={styles.coach} numberOfLines={3}>
              {coachSummary}
            </Text>
          </View>
        ) : null}
    </PremiumCard>
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
  coachWrap: {
    width: "100%",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F0",
  },
  coach: {
    lineHeight: 21,
    opacity: 0.72,
    textAlign: "center",
  },
});
