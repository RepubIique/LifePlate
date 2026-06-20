import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  friendCount: number;
  pendingShareCount: number;
  topTogetherStreak: number;
  topStreakFriendName?: string | null;
};

function StatBlock({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={accent ? "#E67E22" : "#40916C"}
      />
      <Text variant="headlineSmall" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

export function FriendsOverviewCard({
  friendCount,
  pendingShareCount,
  topTogetherStreak,
  topStreakFriendName,
}: Props) {
  const streakHint =
    topTogetherStreak > 0 && topStreakFriendName
      ? `Best with ${topStreakFriendName.trim()}`
      : topTogetherStreak > 0
        ? "Keep logging together"
        : friendCount > 0
          ? "Log a meal on the same day to start a streak"
          : "Add a friend to share meals and stay accountable";

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Your circle
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {streakHint}
      </Text>
      <View style={styles.row}>
        <StatBlock
          icon="account-group-outline"
          value={String(friendCount)}
          label={friendCount === 1 ? "Friend" : "Friends"}
        />
        <StatBlock
          icon="food-fork-drink"
          value={String(pendingShareCount)}
          label="Pending"
          accent={pendingShareCount > 0}
        />
        <StatBlock
          icon="fire"
          value={String(topTogetherStreak)}
          label="Best streak"
          accent={topTogetherStreak > 0}
        />
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: "#F8FBF9",
  },
  title: { letterSpacing: 0.15, color: "#1B4332" },
  subtitle: { opacity: 0.6, lineHeight: 18 },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontWeight: "700",
    color: "#1B4332",
    letterSpacing: -0.3,
  },
  statLabel: {
    opacity: 0.55,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
