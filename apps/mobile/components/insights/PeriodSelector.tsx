import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ComparisonPeriod } from "@lifeplate/shared";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  value: ComparisonPeriod;
  onChange: (period: ComparisonPeriod) => void;
};

const OPTIONS: Array<{ key: ComparisonPeriod; label: string; enabled: boolean }> = [
  { key: "day", label: "Day", enabled: true },
  { key: "week", label: "Week", enabled: true },
  { key: "month", label: "Month", enabled: true },
];

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      backgroundColor: ui.trackBackground,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    option: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      borderRadius: 10,
      gap: 2,
    },
    optionActive: {
      backgroundColor: semantic.surface,
    },
    optionDisabled: {
      opacity: 0.45,
    },
    optionText: {
      opacity: 0.55,
      letterSpacing: 0.2,
    },
    optionTextActive: {
      opacity: 1,
      color: semantic.primary,
    },
    optionTextDisabled: {
      opacity: 0.35,
    },
  });
}

export function PeriodSelector({ value, onChange }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      {OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            style={[
              styles.option,
              active && styles.optionActive,
              !option.enabled && styles.optionDisabled,
            ]}
            onPress={() => option.enabled && onChange(option.key)}
            disabled={!option.enabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: !option.enabled }}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.optionText,
                active && styles.optionTextActive,
                !option.enabled && styles.optionTextDisabled,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
