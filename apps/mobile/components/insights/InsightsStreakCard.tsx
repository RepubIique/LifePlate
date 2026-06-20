import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  currentStreak: number;
  longestStreak: number;
  mealsThisWeek: number;
  mealsLastWeek?: number;
};

function buildEncouragement(mealsThisWeek: number, mealsLastWeek?: number): string | null {
  if (mealsLastWeek == null) return null;
  const delta = mealsThisWeek - mealsLastWeek;
  if (delta > 0) {
    return `You logged ${mealsThisWeek} meals this week — ${delta} more than last week.`;
  }
  if (delta === 0 && mealsThisWeek > 0) {
    return `You logged ${mealsThisWeek} meals this week — steady as last week.`;
  }
  if (mealsThisWeek > 0) {
    return `You logged ${mealsThisWeek} meals this week. Every log helps your story.`;
  }
  return null;
}

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
      <MaterialCommunityIcons name={icon} size={20} color={semantic.primary} />
      <Text variant="headlineSmall" style={styles.value}>
        {value}
      </Text>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

export function InsightsStreakCard({
  currentStreak,
  longestStreak,
  mealsThisWeek,
  mealsLastWeek,
}: Props) {
  const encouragement = buildEncouragement(mealsThisWeek, mealsLastWeek);
  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Your consistency
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Logging regularly builds your health story.
      </Text>
      {encouragement ? (
        <Text variant="bodySmall" style={styles.encouragement}>
          {encouragement}
        </Text>
      ) : null}
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
    backgroundColor: ui.cardBackground,
  },
  title: { letterSpacing: 0.15, color: semantic.primary },
  subtitle: { opacity: 0.55, lineHeight: 18 },
  encouragement: {
    opacity: 0.7,
    lineHeight: 18,
    color: semantic.primary,
    fontStyle: "italic",
  },
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
    color: semantic.primary,
    letterSpacing: -0.3,
  },
  label: {
    opacity: 0.55,
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
