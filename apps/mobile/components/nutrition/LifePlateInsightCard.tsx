import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  insight: string;
};

export function LifePlateInsightCard({ insight }: Props) {
  return (
    <PremiumCard>
      <Text variant="labelLarge" style={styles.label}>
        LifePlate Insight
      </Text>
      <Text variant="bodyLarge" style={styles.insight}>
        &ldquo;{insight}&rdquo;
      </Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  label: {
    opacity: 0.55,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  insight: { lineHeight: 24, fontStyle: "italic", opacity: 0.9 },
});
