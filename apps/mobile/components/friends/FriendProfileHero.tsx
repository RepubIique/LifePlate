import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendProfileSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  profile: FriendProfileSummary;
};

export function FriendProfileHero({ profile }: Props) {
  const label = profile.name?.trim() || "Friend";

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.content}>
        <FriendAvatar
          id={profile.id}
          name={profile.name}
          hasAvatar={profile.hasAvatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {label}
        </Text>

        <View style={styles.chipRow}>
          <View
            style={[
              styles.statusChip,
              profile.loggedToday ? styles.statusChipActive : styles.statusChipIdle,
            ]}
          >
            <MaterialCommunityIcons
              name={profile.loggedToday ? "check-circle-outline" : "clock-outline"}
              size={14}
              color={profile.loggedToday ? "#40916C" : "#636E72"}
            />
            <Text
              variant="labelMedium"
              style={profile.loggedToday ? styles.statusActiveText : styles.statusIdleText}
            >
              {profile.loggedToday ? "Logged today" : "Not logged yet today"}
            </Text>
          </View>

          {profile.togetherStreak > 0 ? (
            <View style={styles.streakChip}>
              <MaterialCommunityIcons name="fire" size={14} color="#E67E22" />
              <Text variant="labelMedium" style={styles.streakText}>
                {profile.togetherStreak} day{profile.togetherStreak === 1 ? "" : "s"} together
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FBF9",
  },
  content: {
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    color: "#1B4332",
    fontWeight: "600",
    letterSpacing: 0.15,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipActive: {
    backgroundColor: "#D8F3DC",
  },
  statusChipIdle: {
    backgroundColor: "#F1F3F5",
  },
  statusActiveText: {
    color: "#1B4332",
    fontWeight: "600",
  },
  statusIdleText: {
    color: "#636E72",
    fontWeight: "600",
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF3E0",
  },
  streakText: {
    color: "#E67E22",
    fontWeight: "600",
  },
});
