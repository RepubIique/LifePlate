import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendProfileSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  profile: FriendProfileSummary;
};

function createStyles({ semantic, tints, ui }: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: ui.cardBackground,
    },
    content: {
      alignItems: "center",
      gap: spacing.sm,
    },
    name: {
      color: semantic.primary,
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
      backgroundColor: ui.selectedBackground,
    },
    statusChipIdle: {
      backgroundColor: ui.trackBackground,
    },
    statusActiveText: {
      color: semantic.primary,
      fontWeight: "600",
    },
    statusIdleText: {
      color: semantic.textMuted,
      fontWeight: "600",
    },
    streakChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: tints.orangeLight,
    },
    streakText: {
      color: ui.iconStreak,
      fontWeight: "600",
    },
  });
}

export function FriendProfileHero({ profile }: Props) {
  const styles = useThemedStyles(createStyles);
  const { semantic, ui } = useAppColors();
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
              color={profile.loggedToday ? semantic.primary : semantic.textMuted}
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
              <MaterialCommunityIcons name="fire" size={14} color={ui.iconStreak} />
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
