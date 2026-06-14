import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ScoreStatus } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  score: number;
  scoreStatus: ScoreStatus;
  coachSummary: string;
  hasMeals?: boolean;
};

function scoreBadgeLabel(status: ScoreStatus): string {
  if (status === "excellent") return "Excellent";
  if (status === "good") return "Good";
  return "Room to grow";
}

function scoreBadgeStatus(status: ScoreStatus): "good" | "moderate" | "low" {
  if (status === "excellent" || status === "good") return "good";
  if (status === "needs_work") return "low";
  return "moderate";
}

export function NutritionScoreHero({ score, scoreStatus, coachSummary, hasMeals = true }: Props) {
  return (
    <PremiumCard style={styles.card}>
      <View style={styles.heroRow}>
        <ScoreRing score={score} scoreStatus={scoreStatus} size={96} />
        <View style={styles.meta}>
          <Text variant="labelLarge" style={styles.caption}>
            Today&apos;s score
          </Text>
          <StatusBadge
            status={scoreBadgeStatus(scoreStatus)}
            label={scoreBadgeLabel(scoreStatus)}
          />
          <Text variant="bodySmall" style={styles.outOf}>
            out of 100
          </Text>
        </View>
      </View>
      <Text variant="bodyLarge" style={styles.summary}>
        {hasMeals
          ? `"${coachSummary}"`
          : "Log a meal to unlock your personalised coach summary."}
      </Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: "#F8FBF9",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  caption: {
    opacity: 0.55,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  outOf: { opacity: 0.45 },
  summary: {
    lineHeight: 24,
    fontStyle: "italic",
    opacity: 0.9,
  },
});
