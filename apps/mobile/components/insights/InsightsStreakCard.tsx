import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  currentStreak: number;
  longestStreak: number;
  mealsThisWeek: number;
};

function StatBlock({
  icon,
  value,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={20} color="#40916C" />
      <Text variant="headlineSmall" style={styles.value}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

export function InsightsStreakCard({ currentStreak, longestStreak, mealsThisWeek }: Props) {
  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Your consistency
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Logging regularly builds your health story.
      </Text>
      <View style={styles.row}>
        <StatBlock icon="fire" value={String(currentStreak)} label="Day streak" />
        <StatBlock icon="trophy-outline" value={String(longestStreak)} label="Best streak" />
        <StatBlock icon="calendar-week" value={String(mealsThisWeek)} label="Meals this week" />
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
  subtitle: { opacity: 0.55, lineHeight: 18 },
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
