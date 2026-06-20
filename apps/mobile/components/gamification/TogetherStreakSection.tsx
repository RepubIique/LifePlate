import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
};

export function TogetherStreakSection({ friends }: Props) {
  const withStreak = friends.filter((f) => (f.togetherStreak ?? 0) > 0);
  if (withStreak.length === 0) return null;

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Logging together
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Days you and a friend both logged a meal.
      </Text>
      <View style={styles.list}>
        {withStreak.map((friend) => (
          <View key={friend.id} style={styles.row}>
            <MaterialCommunityIcons name="account-heart-outline" size={20} color="#40916C" />
            <Text variant="bodyMedium" style={styles.name}>
              {friend.name?.trim() || "Friend"}
            </Text>
            <Text variant="labelLarge" style={styles.streak}>
              {friend.togetherStreak} day{(friend.togetherStreak ?? 0) === 1 ? "" : "s"}
            </Text>
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
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  name: { flex: 1, color: "#1B4332" },
  streak: { color: "#40916C", fontWeight: "600" },
});
