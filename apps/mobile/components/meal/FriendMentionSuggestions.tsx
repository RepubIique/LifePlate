import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { friendMentionLabel } from "@/lib/mealNotesFormat";
import { spacing } from "@/src/theme/lifeplate";
import { premium } from "@/src/theme/premium";

type Props = {
  friends: FriendSummary[];
  query: string;
  onSelect: (friend: FriendSummary) => void;
};

export function FriendMentionSuggestions({ friends, query, onSelect }: Props) {
  if (friends.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text variant="bodySmall" style={styles.empty}>
          {query.trim()
            ? "No matching friends."
            : "Add friends on the Friends tab to tag them with @."}
        </Text>
        {!query.trim() ? (
          <Pressable onPress={() => router.push("/(tabs)/friends")}>
            <Text variant="labelLarge" style={styles.link}>
              Go to Friends
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text variant="labelSmall" style={styles.title}>
        Tag a friend
      </Text>
      {friends.map((friend) => (
        <Pressable
          key={friend.id}
          style={styles.row}
          onPress={() => onSelect(friend)}
          accessibilityRole="button"
        >
          <Text variant="bodyMedium" style={styles.name}>
            @{friendMentionLabel(friend.name)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: premium.borderColor,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    overflow: "hidden",
  },
  title: {
    opacity: 0.55,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    color: "#1B4332",
  },
  empty: {
    opacity: 0.65,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    lineHeight: 18,
  },
  link: {
    color: "#1B4332",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
