import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  label: string;
  weekOffset: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function PlanWeekNavigator({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: Props) {
  const { semantic } = useAppColors();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
      },
      label: {
        color: semantic.primary,
        letterSpacing: 0.15,
        fontWeight: "600",
      },
      controls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
      },
      hint: {
        opacity: 0.5,
        textAlign: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
      },
    }),
  );

  return (
    <View>
      <View style={styles.row}>
        <IconButton
          icon="chevron-left"
          size={22}
          disabled={!canGoPrev}
          onPress={onPrev}
          accessibilityLabel="Previous week"
        />
        <Text variant="titleSmall" style={styles.label}>
          {label}
        </Text>
        <IconButton
          icon="chevron-right"
          size={22}
          disabled={!canGoNext}
          onPress={onNext}
          accessibilityLabel="Next week"
        />
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        Plan up to 2 weeks ahead — penciled meals stay faded until you confirm them.
      </Text>
    </View>
  );
}
