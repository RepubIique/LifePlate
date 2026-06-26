import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { PILLAR_COLORS } from "@/lib/pillarTheme";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  glasses: number;
  target?: number;
  syncing?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

function createStyles({ ui }: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: ui.cardBackground,
      borderRadius: 14,
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    label: { letterSpacing: 0.15 },
    count: { opacity: 0.55, marginTop: 1 },
    countSyncing: { opacity: 0.35 },
    controls: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
}

export function TimelineDayHydration({
  glasses,
  target = 8,
  syncing = false,
  onIncrement,
  onDecrement,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { ui } = useAppColors();
  const fillColor = PILLAR_COLORS.hydration;

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <PillarIcon pillar="hydration" color={fillColor} size={24} variant="badge" />
        <View>
          <Text variant="labelLarge" style={styles.label}>
            Hydration
          </Text>
          <Text variant="bodySmall" style={[styles.count, syncing && styles.countSyncing]}>
            {glasses} of {target} glasses
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <IconButton
          icon="minus"
          size={16}
          mode="contained-tonal"
          containerColor={ui.trackBackground}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }}
          disabled={glasses <= 0}
        />
        <IconButton
          icon="plus"
          size={16}
          mode="contained"
          containerColor={palette.slateBlue}
          iconColor={palette.white}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onIncrement();
          }}
          disabled={glasses >= 24}
        />
      </View>
    </View>
  );
}
