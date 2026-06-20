import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  step: number;
  total: number;
};

export function OnboardingStepLabel({ step, total }: Props) {
  return (
    <Text variant="labelMedium" style={styles.label}>
      Step {step} of {total}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    opacity: 0.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
});
