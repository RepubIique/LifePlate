import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
};

export function ProfileStatsRow({ mealsLogged, currentStreak, longestStreak }: Props) {
  const stats = [
    { icon: "silverware-fork-knife" as const, value: String(mealsLogged), label: "Meals" },
    { icon: "fire" as const, value: String(currentStreak), label: "Streak" },
    { icon: "trophy-outline" as const, value: String(longestStreak), label: "Best" },
  ];

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <PremiumCard key={stat.label} style={styles.card} noBlur>
          <MaterialCommunityIcons name={stat.icon} size={20} color="#40916C" />
          <Text variant="headlineSmall" style={styles.value}>
            {stat.value}
          </Text>
          <Text variant="labelMedium" style={styles.label}>
            {stat.label}
          </Text>
        </PremiumCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: "#F8FBF9",
  },
  value: {
    fontWeight: "700",
    letterSpacing: -0.3,
    color: "#1B4332",
  },
  label: {
    opacity: 0.55,
    letterSpacing: 0.2,
  },
});
