import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendProfileSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  profile: FriendProfileSummary;
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
      <Text variant="headlineSmall" style={styles.value}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

export function FriendActivityCard({ profile }: Props) {
  const encouragement =
    profile.mealsThisWeek > 0
      ? `${profile.name?.trim() || "They"} logged ${profile.mealsThisWeek} meal${profile.mealsThisWeek === 1 ? "" : "s"} this week.`
      : `${profile.name?.trim() || "They"} hasn't logged a meal this week yet.`;

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        How they're doing
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        {encouragement}
      </Text>
      <View style={styles.row}>
        <StatBlock icon="fire" value={String(profile.currentStreak)} label="Day streak" accent={profile.currentStreak > 0} />
        <StatBlock icon="trophy-outline" value={String(profile.longestStreak)} label="Best streak" />
        <StatBlock icon="calendar-week" value={String(profile.mealsThisWeek)} label="Meals this week" />
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
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
  value: {
    fontWeight: "700",
    color: "#1B4332",
    letterSpacing: -0.3,
  },
  label: {
    opacity: 0.55,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
