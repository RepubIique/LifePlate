import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type FriendsListProps = {
  friends: FriendSummary[];
  onRemove: (friendId: string) => void;
};

export function FriendsList({ friends, onRemove }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <PremiumCard style={styles.empty}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No friends yet. Add someone with their friend code above.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <View style={styles.list}>
      {friends.map((friend) => {
        const label = friend.name?.trim() || "Friend";
        return (
          <Pressable
            key={friend.id}
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
            <PremiumCard style={styles.row} noBlur>
              <FriendAvatar id={friend.id} name={friend.name} hasAvatar={friend.hasAvatar} />
              <Text variant="titleMedium" style={styles.name}>
                {label}
              </Text>
            </PremiumCard>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#FFFFFF",
  },
  name: { flex: 1, color: "#1B4332" },
  empty: { backgroundColor: "#F8FBF9" },
  emptyText: { opacity: 0.7, textAlign: "center" },
});
