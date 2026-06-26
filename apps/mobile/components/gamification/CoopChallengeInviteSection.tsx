import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
  busyFriendId?: string | null;
  onInvite: (friendId: string) => void;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: spacing.sm, backgroundColor: ui.cardBackground },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: ui.selectedBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCopy: { flex: 1, gap: 2 },
    title: { color: semantic.primary },
    subtitle: { opacity: 0.6, lineHeight: 18 },
    list: { marginTop: spacing.xs },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    name: { flex: 1, color: semantic.primary },
    divider: {
      height: 1,
      backgroundColor: ui.trackBackground,
      marginLeft: 52,
    },
  });
}

export function CoopChallengeInviteSection({ friends, busyFriendId, onInvite }: Props) {
  const styles = useThemedStyles(createStyles);
  const { semantic } = useAppColors();

  if (friends.length === 0) return null;

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="handshake-outline" size={20} color={semantic.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text variant="titleMedium" style={styles.title}>
            Weekly co-op challenge
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Invite a friend — both hit hydration 5 of 7 days this week.
          </Text>
        </View>
      </View>
      <View style={styles.list}>
        {friends.map((friend, index) => (
          <View key={friend.id}>
            <View style={styles.row}>
              <FriendAvatar id={friend.id} name={friend.name} hasAvatar={friend.hasAvatar} />
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
            {index < friends.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}
