import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { HydrationLevelFill } from "@/components/home/HydrationLevelFill";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { pillarStatusHeadline } from "@/lib/dayStatusLabels";
import { pillarColor } from "@/components/ui/pillarColors";
import { pillarColorForLabel } from "@/lib/pillarTheme";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  pillar: PillarProgress;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function HydrationQuickAdd({
  pillar,
  onIncrement,
  onDecrement,
}: Props) {
  const total = Math.max(pillar.target, 1);
  const filled = Math.min(pillar.consumed, total);
  const progress = filled / total;
  const statusColor = pillarColor(pillar.status);

  return (
    <PremiumCard style={styles.card}>
      <HydrationLevelFill progress={progress} total={total} filled={filled}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <PillarIcon
              pillar="hydration"
              color={pillarColorForLabel("Hydration")}
              size={28}
              variant="badge"
            />
            <View style={styles.titleCol}>
              <Text variant="titleMedium" style={styles.title}>
                Hydration
              </Text>
              <Text variant="bodySmall" style={styles.subtitle}>
                {filled} of {total} glasses
              </Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Text variant="labelMedium" style={[styles.status, { color: statusColor }]}>
              {pillarStatusHeadline(pillar.status)}
            </Text>
            <View style={styles.controls}>
              <IconButton
                icon="minus"
                size={18}
                mode="contained-tonal"
                containerColor="rgba(255, 255, 255, 0.92)"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDecrement();
                }}
                disabled={pillar.consumed <= 0}
              />
              <IconButton
                icon="plus"
                size={18}
                mode="contained"
                containerColor={palette.slateBlue}
                iconColor={palette.white}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onIncrement();
                }}
                disabled={pillar.consumed >= pillar.target}
              />
            </View>
          </View>
        </View>
      </HydrationLevelFill>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: palette.teal,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    letterSpacing: 0.15,
    color: semantic.primary,
  },
  subtitle: {
    opacity: 0.55,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  status: {
    fontWeight: "600",
    letterSpacing: 0.15,
    marginRight: spacing.xs,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -8,
  },
});
