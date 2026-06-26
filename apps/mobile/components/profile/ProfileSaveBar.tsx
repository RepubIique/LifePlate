import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Button } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
};

function createStyles(_colors: AppColors) {
  return StyleSheet.create({
    card: {
      paddingVertical: spacing.md,
    },
  });
}

export function ProfileSaveBar({ visible, saving, onSave }: Props) {
  const styles = useThemedStyles(createStyles);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    pulse.value = withSequence(
      withTiming(1.02, { duration: 180, easing: Easing.out(Easing.ease) }),
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.015, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        2,
        false,
      ),
      withTiming(1, { duration: 180 }),
    );
  }, [pulse, visible]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320).springify().damping(18)}
      exiting={FadeOutUp.duration(200)}
    >
      <PremiumCard style={styles.card} noBlur>
        <Animated.View style={buttonStyle}>
          <Button
            mode="contained"
            onPress={onSave}
            disabled={saving}
            loading={saving}
            icon="content-save-outline"
          >
            Save changes
          </Button>
        </Animated.View>
      </PremiumCard>
    </Animated.View>
  );
}
