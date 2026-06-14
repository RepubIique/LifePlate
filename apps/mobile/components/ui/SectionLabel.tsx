import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionLabel({ title, subtitle }: Props) {
  return (
    <>
      <Text variant="titleSmall" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodySmall" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    opacity: 0.55,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  subtitle: {
    opacity: 0.45,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
