import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { HydrationLevelFill } from "@/components/home/HydrationLevelFill";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { pillarColorForLabel } from "@/lib/pillarTheme";

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

  return (
    <PremiumCard style={styles.card}>
      <HydrationLevelFill progress={progress} total={total} filled={filled}>
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
              containerColor="rgba(255, 255, 255, 0.9)"
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
              containerColor="#1B4332"
              iconColor="#FFFFFF"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onIncrement();
              }}
              disabled={pillar.consumed >= pillar.target}
            />
          </View>
        </View>
      </HydrationLevelFill>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    backgroundColor: "#F8FBFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.55, marginTop: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -8,
  },
});
