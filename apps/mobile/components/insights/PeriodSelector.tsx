import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ComparisonPeriod } from "@lifeplate/shared";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  value: ComparisonPeriod;
  onChange: (period: ComparisonPeriod) => void;
};

const OPTIONS: Array<{ key: ComparisonPeriod; label: string; enabled: boolean; soon?: boolean }> = [
  { key: "day", label: "Day", enabled: true },
  { key: "week", label: "Week", enabled: false, soon: true },
  { key: "month", label: "Month", enabled: false, soon: true },
];

export function PeriodSelector({ value, onChange }: Props) {
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
            {option.soon ? (
              <Text variant="labelSmall" style={styles.soon}>
                Soon
              </Text>
            ) : (
              <View style={styles.soonSpacer} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#EEF2F0",
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
    backgroundColor: "#FFFFFF",
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
    color: "#1B4332",
  },
  optionTextDisabled: {
    opacity: 0.35,
  },
  soon: {
    opacity: 0.45,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    lineHeight: 14,
  },
  soonSpacer: {
    height: 14,
  },
});
