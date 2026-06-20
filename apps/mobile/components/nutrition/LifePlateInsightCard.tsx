import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  insight: string;
};

export function LifePlateInsightCard({ insight }: Props) {
  if (!insight) return null;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text variant="labelLarge" style={styles.label}>
          LifePlate insight
        </Text>
        <Text variant="bodyLarge" style={styles.insight}>
          &ldquo;{insight}&rdquo;
        </Text>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    padding: 0,
    backgroundColor: ui.cardBackground,
  },
  accent: {
    width: 4,
    backgroundColor: semantic.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    opacity: 0.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  insight: {
    lineHeight: 24,
    fontStyle: "italic",
    opacity: 0.9,
  },
});
