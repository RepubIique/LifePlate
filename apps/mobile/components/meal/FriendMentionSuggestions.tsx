import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { friendMentionLabel } from "@/lib/mealNotesFormat";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { createPremiumTokens } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
  query: string;
  onSelect: (friend: FriendSummary) => void;
};

function createStyles(colors: AppColors) {
  const premium = createPremiumTokens(colors);
  return StyleSheet.create({
    wrap: {
      borderWidth: 1,
      borderColor: premium.borderColor,
      borderRadius: 12,
      backgroundColor: colors.semantic.surface,
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
      color: colors.semantic.primary,
    },
    empty: {
      opacity: 0.65,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      lineHeight: 18,
    },
    link: {
      color: colors.semantic.primary,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
  });
}

export function FriendMentionSuggestions({ friends, query, onSelect }: Props) {
  const styles = useThemedStyles(createStyles);

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
