import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { pillarColorForLabel } from "@/lib/pillarTheme";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  pillar: PillarProgress;
};

export function PillarMiniBar({ pillar }: Props) {
  const fillColor = pillarColorForLabel(pillar.label);

  return (
    <View style={styles.row}>
      <PillarIcon
        pillar={pillar.label}
        color={pillarColorForLabel(pillar.label)}
        size={24}
        variant="badge"
      />
      <View style={styles.body}>
        <View style={styles.labelRow}>
          <Text variant="labelLarge" style={styles.label}>
            {pillar.label}
          </Text>
          <Text variant="labelMedium" style={styles.value}>
            {pillar.consumed}
            {pillar.unit === "g" ? "g" : ` ${pillar.unit}`}
          </Text>
        </View>
        <ProgressBar progress={pillar.progress} color={fillColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  body: { flex: 1, gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { letterSpacing: 0.2 },
  value: { opacity: 0.55 },
});
