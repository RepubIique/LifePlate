import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
  busyFriendId?: string | null;
  onInvite: (friendId: string) => void;
};

export function CoopChallengeInviteSection({ friends, busyFriendId, onInvite }: Props) {
  if (friends.length === 0) return null;

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Weekly co-op challenge
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Invite a friend — both hit hydration 5 of 7 days this week.
      </Text>
      <View style={styles.list}>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.row}>
            <Text variant="bodyMedium" style={styles.name}>
              {friend.name?.trim() || "Friend"}
            </Text>
            <Button
              mode="outlined"
              compact
              loading={busyFriendId === friend.id}
              disabled={busyFriendId != null}
              onPress={() => onInvite(friend.id)}
            >
              Invite
            </Button>
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, backgroundColor: "#F8FBF9" },
  title: { color: "#1B4332" },
  subtitle: { opacity: 0.6, lineHeight: 18 },
  list: { gap: spacing.xs, marginTop: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: { flex: 1, color: "#1B4332" },
});
