import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { TimelineSummaryStats } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = TimelineSummaryStats;

type StatItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: ui.cardBackground,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    chip: {
      flex: 1,
      alignItems: "center",
      gap: 2,
      minWidth: 0,
    },
    value: {
      fontWeight: "700",
      letterSpacing: -0.2,
      color: semantic.primary,
    },
    label: {
      opacity: 0.55,
      letterSpacing: 0.1,
      textAlign: "center",
    },
  });
}

function StatChip({
  icon,
  value,
  label,
  styles,
}: StatItem & { styles: ReturnType<typeof createStyles> }) {
  const { semantic } = useAppColors();

  return (
    <View style={styles.chip}>
      <MaterialCommunityIcons name={icon} size={14} color={semantic.primary} />
      <Text variant="labelLarge" style={styles.value}>
        {value}
      </Text>
      <Text variant="labelSmall" style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function TimelineSummaryBar({
  totalMeals,
  weekMeals,
  loggedDays,
  hydrationGlasses,
  homeCookedPercent,
}: Props) {
  const styles = useThemedStyles(createStyles);

  const stats: StatItem[] = [
    { icon: "book-open-page-variant", value: String(totalMeals), label: "Total" },
    { icon: "calendar-week", value: String(weekMeals), label: "Week" },
    { icon: "calendar-check", value: String(loggedDays), label: "Days" },
    { icon: "cup-water", value: String(hydrationGlasses), label: "Water" },
    {
      icon: "home-outline",
      value: homeCookedPercent == null ? "—" : `${homeCookedPercent}%`,
      label: "Home",
    },
  ];

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.row}>
        {stats.map((stat) => (
          <StatChip key={stat.label} {...stat} styles={styles} />
        ))}
      </View>
    </PremiumCard>
  );
}
