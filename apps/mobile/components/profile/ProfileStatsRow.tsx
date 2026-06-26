import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  mealsLogged: number;
  currentStreak: number;
  longestStreak: number;
};

function createStyles({ semantic, tints, ui }: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    statWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "stretch",
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
      paddingHorizontal: spacing.xs,
    },
    divider: {
      width: 1,
      backgroundColor: ui.trackBackground,
      marginVertical: spacing.xs,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tints.tealLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    value: {
      fontWeight: "700",
      letterSpacing: -0.3,
      color: semantic.primary,
    },
    label: {
      opacity: 0.55,
      letterSpacing: 0.1,
      textAlign: "center",
    },
  });
}

export function ProfileStatsRow({ mealsLogged, currentStreak, longestStreak }: Props) {
  const { semantic } = useAppColors();
  const styles = useThemedStyles(createStyles);
  const stats = [
    { icon: "silverware-fork-knife" as const, value: String(mealsLogged), label: "Meals logged" },
    { icon: "fire" as const, value: String(currentStreak), label: "Current streak" },
    { icon: "trophy-outline" as const, value: String(longestStreak), label: "Best streak" },
  ];

  return (
    <PremiumCard style={styles.card} noBlur>
      {stats.map((stat, index) => (
        <View key={stat.label} style={styles.statWrap}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.stat}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={stat.icon} size={18} color={semantic.primary} />
            </View>
            <Text variant="headlineSmall" style={styles.value}>
              {stat.value}
            </Text>
            <Text variant="labelSmall" style={styles.label}>
              {stat.label}
            </Text>
          </View>
        </View>
      ))}
    </PremiumCard>
  );
}
