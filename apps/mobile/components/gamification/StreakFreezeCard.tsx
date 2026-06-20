import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  available: boolean;
  isPaid: boolean;
  loading?: boolean;
  onUse: () => void;
};

export function StreakFreezeCard({ available, isPaid, loading, onUse }: Props) {
  if (!isPaid) {
    return (
      <PremiumCard style={styles.card} noBlur>
        <Text variant="titleMedium" style={styles.title}>
          Streak freeze
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          LifePlate Plus includes one streak freeze per month if you miss a day.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Streak freeze
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {available
          ? "Missed yesterday? Cover one gap this month without losing your streak."
          : "You've used your streak freeze this month."}
      </Text>
      {available ? (
        <Button mode="outlined" loading={loading} disabled={loading} onPress={onUse} style={styles.button}>
          Use streak freeze
        </Button>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { color: semantic.primary },
  subtitle: { opacity: 0.65, lineHeight: 20 },
  button: { alignSelf: "flex-start", marginTop: spacing.xs },
});
