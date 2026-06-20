import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
};

export function TogetherStreakSection({ friends }: Props) {
  const withStreak = friends
    .filter((f) => (f.togetherStreak ?? 0) > 0)
    .sort((a, b) => (b.togetherStreak ?? 0) - (a.togetherStreak ?? 0));

  if (withStreak.length === 0) return null;

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.header}>
        <MaterialCommunityIcons name="fire" size={20} color="#E67E22" />
        <View style={styles.headerCopy}>
          <Text variant="titleMedium" style={styles.title}>
            Logging together
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Days you and a friend both logged a meal.
          </Text>
        </View>
      </View>
      <View style={styles.list}>
        {withStreak.map((friend, index) => (
          <View key={friend.id}>
            <View style={styles.row}>
              <FriendAvatar id={friend.id} name={friend.name} hasAvatar={friend.hasAvatar} />
              <Text variant="bodyMedium" style={styles.name}>
                {friend.name?.trim() || "Friend"}
              </Text>
              <View style={styles.streakPill}>
                <MaterialCommunityIcons name="fire" size={14} color="#E67E22" />
                <Text variant="labelLarge" style={styles.streak}>
                  {friend.togetherStreak}
                </Text>
              </View>
            </View>
            {index < withStreak.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, backgroundColor: "#FFFBF5" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: "#1B4332" },
  subtitle: { opacity: 0.6, lineHeight: 18 },
  list: { marginTop: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  name: { flex: 1, color: "#1B4332" },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  streak: { color: "#E67E22", fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: "#F5E6D3",
    marginLeft: 52,
  },
});
