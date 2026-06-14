import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  totalMeals: number;
  weekMeals: number;
};

export function TimelineSummaryBar({ totalMeals, weekMeals }: Props) {
  return (
    <View style={styles.row}>
      <PremiumCard style={styles.card} noBlur>
        <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#40916C" />
        <Text variant="headlineSmall" style={styles.value}>
          {totalMeals}
        </Text>
        <Text variant="labelMedium" style={styles.label}>
          Total logged
        </Text>
      </PremiumCard>
      <PremiumCard style={styles.card} noBlur>
        <MaterialCommunityIcons name="calendar-week" size={20} color="#40916C" />
        <Text variant="headlineSmall" style={styles.value}>
          {weekMeals}
        </Text>
        <Text variant="labelMedium" style={styles.label}>
          This week
        </Text>
      </PremiumCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.md,
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
