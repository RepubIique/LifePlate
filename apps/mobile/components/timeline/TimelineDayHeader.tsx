import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  day: string;
  subtitle: string;
  mealCount: number;
  isToday?: boolean;
};

export function TimelineDayHeader({ day, subtitle, mealCount, isToday = false }: Props) {
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      wrap: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
        marginBottom: spacing.sm,
        paddingTop: spacing.xs,
      },
      textCol: { flex: 1, gap: 2 },
      day: {
        letterSpacing: 0.2,
        color: colors.semantic.text,
      },
      dayToday: {
        color: colors.semantic.primary,
        fontWeight: "600",
      },
      subtitle: { opacity: 0.5 },
      pill: {
        backgroundColor: colors.ui.trackBackground,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      },
      pillToday: {
        backgroundColor: colors.ui.selectedBackground,
      },
      pillText: {
        opacity: 0.65,
        letterSpacing: 0.1,
      },
      pillTextToday: {
        color: colors.semantic.primary,
        opacity: 0.9,
        fontWeight: "600",
      },
    }),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text variant="titleMedium" style={[styles.day, isToday && styles.dayToday]}>
          {day}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.pill, isToday && styles.pillToday]}>
        <Text variant="labelMedium" style={[styles.pillText, isToday && styles.pillTextToday]}>
          {mealCount} {mealCount === 1 ? "meal" : "meals"}
        </Text>
      </View>
    </View>
  );
}
