import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { useFriends } from "@/context/FriendsContext";
import { PremiumCard } from "@/components/PremiumCard";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type ShareWithFriendsPickerProps = {
  selectedFriendIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onTotalPeopleChange?: (count: number) => void;
  embedded?: boolean;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: spacing.sm },
    title: { color: semantic.primary },
    subtitle: { opacity: 0.65 },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    chip: { backgroundColor: ui.trackBackground },
    link: {
      color: semantic.primary,
      textDecorationLine: "underline",
      opacity: 0.85,
    },
    embedded: { gap: spacing.sm },
  });
}

export function ShareWithFriendsPicker({
  selectedFriendIds,
  onSelectionChange,
  onTotalPeopleChange,
  embedded = false,
}: ShareWithFriendsPickerProps) {
  const styles = useThemedStyles(createStyles);
  const { friends, hydrated, loadFriends } = useFriends();

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

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

  if (!hydrated) return null;

  const content = (
    <>
      {!embedded ? (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Who ate with you?
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Send the same meal log to friends — they&apos;ll review before it appears on their
            timeline.
          </Text>
        </>
      ) : (
        <Text variant="bodySmall" style={styles.subtitle}>
          Friends review before it appears on their timeline.
        </Text>
      )}

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
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{content}</View>;
  }

  return <PremiumCard style={styles.card}>{content}</PremiumCard>;
}
