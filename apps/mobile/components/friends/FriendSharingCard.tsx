import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendProfileSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  profile: FriendProfileSummary;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.sm,
      backgroundColor: ui.cardBackground,
    },
    title: { color: semantic.primary, letterSpacing: 0.1 },
    subtitle: { opacity: 0.6, lineHeight: 18 },
    empty: { opacity: 0.65, lineHeight: 20 },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      marginTop: spacing.xs,
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      paddingVertical: spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: ui.selectedBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    value: {
      fontWeight: "700",
      color: semantic.primary,
      letterSpacing: -0.3,
    },
    label: {
      opacity: 0.55,
      textAlign: "center",
    },
    divider: {
      width: 1,
      backgroundColor: ui.trackBackground,
      marginVertical: spacing.sm,
    },
  });
}

function ShareStat({
  icon,
  value,
  label,
  styles,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const { semantic } = useAppColors();

  return (
    <View style={styles.stat}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={semantic.primary} />
      </View>
      <Text variant="headlineSmall" style={styles.value}>
        {value}
      </Text>
      <Text variant="labelSmall" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

export function FriendSharingCard({ profile }: Props) {
  const styles = useThemedStyles(createStyles);
  const totalShares = profile.sharesReceivedFromFriend + profile.sharesSentToFriend;
  if (totalShares === 0) {
    return (
      <PremiumCard style={styles.card} noBlur>
        <Text variant="titleMedium" style={styles.title}>
          Meal sharing
        </Text>
        <Text variant="bodySmall" style={styles.empty}>
          No shared meals yet — log a meal and share it with {profile.name?.trim() || "your friend"}.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Meal sharing
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Accepted shares between you two.
      </Text>
      <View style={styles.row}>
        <ShareStat
          icon="arrow-down-bold"
          value={profile.sharesReceivedFromFriend}
          label={`From ${profile.name?.trim() || "friend"}`}
          styles={styles}
        />
        <View style={styles.divider} />
        <ShareStat
          icon="arrow-up-bold"
          value={profile.sharesSentToFriend}
          label="From you"
          styles={styles}
        />
      </View>
    </PremiumCard>
  );
}
