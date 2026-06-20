import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

function friendInitials(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed[0]!.toUpperCase();
}

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
              <View style={styles.avatar}>
                <Text variant="titleMedium" style={styles.avatarText}>
                  {friendInitials(friend.name)}
                </Text>
              </View>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D8F3DC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1B4332", fontWeight: "600" },
  name: { flex: 1, color: "#1B4332" },
  empty: { backgroundColor: "#F8FBF9" },
  emptyText: { opacity: 0.7, textAlign: "center" },
});
