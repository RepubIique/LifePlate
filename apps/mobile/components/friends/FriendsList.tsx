import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type FriendsListProps = {
  friends: FriendSummary[];
  onRemove: (friendId: string) => void;
};

function FriendRow({
  friend,
  onRemove,
  showDivider,
}: {
  friend: FriendSummary;
  onRemove: (friendId: string) => void;
  showDivider: boolean;
}) {
  const label = friend.name?.trim() || "Friend";
  const streak = friend.togetherStreak ?? 0;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() =>
          router.push({
            pathname: "/friend/[id]",
            params: { id: friend.id, name: friend.name ?? "" },
          })
        }
        onLongPress={() => {
          Alert.alert("Remove friend?", `Remove ${label} from your friends?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => onRemove(friend.id),
            },
          ]);
        }}
      >
        <FriendAvatar id={friend.id} name={friend.name} hasAvatar={friend.hasAvatar} />
        <View style={styles.rowCopy}>
          <Text variant="titleMedium" style={styles.name}>
            {label}
          </Text>
          {streak > 0 ? (
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={13} color={ui.iconStreak} />
              <Text variant="labelSmall" style={styles.streakText}>
                {streak} day{streak === 1 ? "" : "s"} together
              </Text>
            </View>
          ) : (
            <Text variant="bodySmall" style={styles.hint}>
              Tap to see how they're doing
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={semantic.textMuted} />
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

export function FriendsList({ friends, onRemove }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <PremiumCard style={styles.empty} noBlur>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="account-group-outline" size={28} color={semantic.primary} />
        </View>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          No friends yet
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Share your code or add a friend above to start logging meals together.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      {friends.map((friend, index) => (
        <FriendRow
          key={friend.id}
          friend={friend}
          onRemove={onRemove}
          showDivider={index < friends.length - 1}
        />
      ))}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.xs,
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: ui.cardBackground },
  rowCopy: { flex: 1, gap: 2 },
  name: { color: semantic.primary },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: { color: ui.iconStreak, fontWeight: "600" },
  hint: { opacity: 0.45 },
  divider: {
    height: 1,
    backgroundColor: ui.trackBackground,
    marginLeft: 56,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: ui.cardBackground,
    paddingVertical: spacing.lg,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ui.selectedBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: semantic.primary },
  emptyText: { opacity: 0.65, textAlign: "center", lineHeight: 22 },
});
