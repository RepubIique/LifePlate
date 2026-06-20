import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { fetchFriends } from "@/lib/api";
import { spacing } from "@/src/theme/lifeplate";

type ShareWithFriendsPickerProps = {
  selectedFriendIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onTotalPeopleChange?: (count: number) => void;
};

export function ShareWithFriendsPicker({
  selectedFriendIds,
  onSelectionChange,
  onTotalPeopleChange,
}: ShareWithFriendsPickerProps) {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchFriends()
      .then((data) => {
        setFriends(data.friends);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    onTotalPeopleChange?.(1 + selectedFriendIds.length);
  }, [selectedFriendIds.length, onTotalPeopleChange]);

  function toggleFriend(friendId: string) {
    if (selectedFriendIds.includes(friendId)) {
      onSelectionChange(selectedFriendIds.filter((id) => id !== friendId));
      return;
    }
    onSelectionChange([...selectedFriendIds, friendId]);
  }

  if (!loaded) return null;

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        Who ate with you?
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Send the same meal log to friends — they&apos;ll review before it appears on their timeline.
      </Text>

      {friends.length === 0 ? (
        <Pressable onPress={() => router.push("/(tabs)/friends")}>
          <Text variant="bodyMedium" style={styles.link}>
            Add friends on the Friends tab to share meals
          </Text>
        </Pressable>
      ) : (
        <View style={styles.chips}>
          {friends.map((friend) => {
            const label = friend.name?.trim() || "Friend";
            const selected = selectedFriendIds.includes(friend.id);
            return (
              <Chip
                key={friend.id}
                selected={selected}
                onPress={() => toggleFriend(friend.id)}
                style={styles.chip}
              >
                {label}
              </Chip>
            );
          })}
        </View>
      )}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { color: "#1B4332" },
  subtitle: { opacity: 0.65 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: { backgroundColor: "#F1F3F5" },
  link: {
    color: "#1B4332",
    textDecorationLine: "underline",
    opacity: 0.85,
  },
});
