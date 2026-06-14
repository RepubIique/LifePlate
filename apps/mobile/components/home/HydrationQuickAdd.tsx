import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { PILLAR_COLORS, pillarColorForLabel } from "@/lib/pillarTheme";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  pillar: PillarProgress;
  onIncrement: () => void;
  onDecrement: () => void;
  updating?: boolean;
};

export function HydrationQuickAdd({
  pillar,
  onIncrement,
  onDecrement,
  updating = false,
}: Props) {
  const fillColor = PILLAR_COLORS.hydration;
  const total = Math.max(pillar.target, 1);
  const filled = Math.min(pillar.consumed, total);

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <PillarIcon
            pillar="hydration"
            color={pillarColorForLabel("Hydration")}
            size={32}
            variant="badge"
          />
          <View>
            <Text variant="titleMedium" style={styles.title}>
              Hydration
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {filled} of {total} glasses
            </Text>
          </View>
        </View>
        <View style={styles.controls}>
          <IconButton
            icon="minus"
            size={18}
            mode="contained-tonal"
            containerColor="#F1F3F5"
            onPress={onDecrement}
            disabled={updating || pillar.consumed <= 0}
          />
          <IconButton
            icon="plus"
            size={18}
            mode="contained"
            containerColor="#1B4332"
            iconColor="#FFFFFF"
            onPress={onIncrement}
            disabled={updating || pillar.consumed >= pillar.target}
          />
        </View>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < filled ? { backgroundColor: fillColor } : styles.dotEmpty,
            ]}
          />
        ))}
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.55, marginTop: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -spacing.sm,
  },
  dots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotEmpty: {
    backgroundColor: "#EEF2F0",
    borderWidth: 1,
    borderColor: "#E2E8E4",
  },
});
