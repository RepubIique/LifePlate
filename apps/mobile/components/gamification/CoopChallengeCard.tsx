import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import type { CoopChallengeSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  challenge: CoopChallengeSummary;
  busy?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
};

export function CoopChallengeCard({ challenge, busy, onAccept, onDecline }: Props) {
  const friendLabel = challenge.friendName?.trim() || "Friend";
  const isPendingInvite = challenge.status === "pending" && !challenge.isInviter;
  const bothProgress = challenge.participants;

  let statusLine = "";
  if (challenge.status === "pending" && challenge.isInviter) {
    statusLine = `Waiting for ${friendLabel} to accept`;
  } else if (challenge.status === "active") {
    statusLine = "This week: both hit hydration 5 of 7 days";
  } else if (challenge.status === "completed") {
    statusLine = "You both did it this week. Nice teamwork.";
  } else if (challenge.status === "expired") {
    statusLine = "Good effort — try again next week.";
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Co-op challenge
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        With {friendLabel}
      </Text>
      {statusLine ? (
        <Text variant="bodyMedium" style={styles.status}>
          {statusLine}
        </Text>
      ) : null}

      {challenge.status === "active" || challenge.status === "completed" ? (
        <View style={styles.progressList}>
          {bothProgress.map((p) => (
            <View key={p.userId} style={styles.progressRow}>
              <Text variant="bodySmall" style={styles.progressName}>
                {p.name?.trim() || "You"}
              </Text>
              <Text variant="labelLarge" style={styles.progressValue}>
                {p.daysCompleted}/{p.daysRequired} days
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {isPendingInvite ? (
        <View style={styles.actions}>
          <Button mode="contained" loading={busy} disabled={busy} onPress={() => onAccept?.(challenge.id)}>
            Accept
          </Button>
          <Button mode="outlined" disabled={busy} onPress={() => onDecline?.(challenge.id)}>
            Decline
          </Button>
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, backgroundColor: "#F8FBF9" },
  title: { color: "#1B4332" },
  subtitle: { opacity: 0.6 },
  status: { color: "#1B4332", lineHeight: 22, opacity: 0.85 },
  progressList: { gap: spacing.xs, marginTop: spacing.xs },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressName: { opacity: 0.7 },
  progressValue: { color: "#40916C", fontWeight: "600" },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
