import { useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useAppColors } from "@/context/ThemeContext";

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { ui } = useAppColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          backgroundColor: ui.skeletonBase,
          overflow: "hidden",
        },
        highlight: {
          backgroundColor: ui.skeletonHighlight,
        },
      }),
    [ui.skeletonBase, ui.skeletonHighlight],
  );
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.95]),
  }));

  return (
    <View
      style={[styles.base, { width, height, borderRadius }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.highlight, { borderRadius }, animatedStyle]}
      />
    </View>
  );
}
