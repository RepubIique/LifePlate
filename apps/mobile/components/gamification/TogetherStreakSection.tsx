import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { FriendAvatar } from "@/components/friends/FriendAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  friends: FriendSummary[];
};

function createStyles({ semantic, tints, ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: spacing.sm, backgroundColor: tints.creamLight },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    headerCopy: { flex: 1, gap: 2 },
    title: { color: semantic.primary },
    subtitle: { opacity: 0.6, lineHeight: 18 },
    list: { marginTop: spacing.xs },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    name: { flex: 1, color: semantic.primary },
    streakPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: tints.orangeLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
    },
    streak: { color: ui.iconStreak, fontWeight: "700" },
    divider: {
      height: 1,
      backgroundColor: palette.cream,
      marginLeft: 52,
    },
  });
}

export function TogetherStreakSection({ friends }: Props) {
  const styles = useThemedStyles(createStyles);
  const { ui } = useAppColors();
  const withStreak = friends
    .filter((f) => (f.togetherStreak ?? 0) > 0)
    .sort((a, b) => (b.togetherStreak ?? 0) - (a.togetherStreak ?? 0));

  if (withStreak.length === 0) return null;

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.header}>
        <MaterialCommunityIcons name="fire" size={20} color={ui.iconStreak} />
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
                <MaterialCommunityIcons name="fire" size={14} color={ui.iconStreak} />
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
