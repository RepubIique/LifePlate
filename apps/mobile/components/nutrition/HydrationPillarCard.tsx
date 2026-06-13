import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { ProgressBlocks, statusEmoji } from "./shared";

type Props = {
  pillar: PillarProgress;
  onIncrement: () => void;
  onDecrement: () => void;
  updating?: boolean;
};

export function HydrationPillarCard({
  pillar,
  onIncrement,
  onDecrement,
  updating = false,
}: Props) {
  const serveLine = pillar.serves
    ? `${pillar.serves.current} / ${pillar.serves.target} glasses`
    : null;

  return (
    <PremiumCard>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {pillar.emoji} {pillar.label}
        </Text>
        <View style={styles.controls}>
          <IconButton
            icon="minus"
            size={20}
            onPress={onDecrement}
            disabled={updating || pillar.consumed <= 0}
          />
          <IconButton
            icon="plus"
            size={20}
            onPress={onIncrement}
            disabled={updating || pillar.consumed >= pillar.target}
          />
        </View>
      </View>
      {serveLine ? (
        <Text variant="headlineSmall" style={styles.serves}>
          {serveLine}
        </Text>
      ) : null}
      <ProgressBlocks progress={pillar.progress} blocks={8} />
      {pillar.tip ? (
        <Text variant="bodyMedium" style={styles.tip}>
          {statusEmoji(pillar.status)} {pillar.tip}
        </Text>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { letterSpacing: 0.15, flex: 1 },
  controls: { flexDirection: "row", marginRight: -spacing.sm },
  serves: { marginTop: spacing.xs, marginBottom: spacing.xs },
  tip: { marginTop: spacing.md, lineHeight: 22, opacity: 0.85 },
});
