import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ScoreStatus } from "@lifeplate/shared";
import { scoreStatusEmoji } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  score: number;
  scoreStatus: ScoreStatus;
  coachSummary: string;
};

export function NutritionScoreHero({ score, scoreStatus, coachSummary }: Props) {
  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        Today&apos;s Nutrition Score
      </Text>
      <View style={styles.scoreRow}>
        <Text variant="displaySmall" style={styles.score}>
          {score}
        </Text>
        <Text variant="headlineSmall" style={styles.outOf}>
          / 100 {scoreStatusEmoji(scoreStatus)}
        </Text>
      </View>
      <Text variant="bodyLarge" style={styles.summary}>
        &ldquo;{coachSummary}&rdquo;
      </Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15, opacity: 0.8 },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs, marginTop: spacing.sm },
  score: { fontWeight: "700", letterSpacing: -1 },
  outOf: { opacity: 0.7, marginBottom: 4 },
  summary: { marginTop: spacing.md, lineHeight: 24, fontStyle: "italic", opacity: 0.9 },
});
