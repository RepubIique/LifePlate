import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { PILLAR_COLORS } from "@/lib/pillarTheme";

const AnimatedG = Animated.createAnimatedComponent(G);

const WATER_DEEP = PILLAR_COLORS.hydration;
const WATER_MID = "#6BAEF2";
const WATER_LIGHT = "#A8D8FF";

type Props = {
  size: number;
  progress: number;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildWavePath(width: number, amplitude: number, baseline: number, bodyHeight: number): string {
  const segment = width / 2;
  return (
    `M 0 ${baseline}` +
    ` C ${segment * 0.25} ${baseline - amplitude}, ${segment * 0.75} ${baseline + amplitude}, ${segment} ${baseline}` +
    ` C ${segment * 1.25} ${baseline - amplitude}, ${segment * 1.75} ${baseline + amplitude}, ${width} ${baseline}` +
    ` L ${width} ${baseline + bodyHeight} L 0 ${baseline + bodyHeight} Z`
  );
}

export function PlateCenterWater({ size, progress }: Props) {
  const radius = size / 2;
  const amplitude = Math.max(2.5, size * 0.03);
  const waveHeight = amplitude * 2.2;
  const waveWidth = size * 2;
  const fill = useSharedValue(clampProgress(progress));
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    fill.value = withSpring(clampProgress(progress), {
      damping: 18,
      stiffness: 110,
    });
  }, [fill, progress]);

  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [wavePhase]);

  const waterBodyProps = useAnimatedProps(() => ({
    transform: [{ translateY: size * (1 - fill.value) }],
  }));

  const backWaveProps = useAnimatedProps(() => ({
    transform: [{ translateX: wavePhase.value * -size }],
  }));

  const frontWaveProps = useAnimatedProps(() => ({
    transform: [{ translateX: wavePhase.value * -size * 1.35 + size * 0.35 }],
  }));

  const backWave = buildWavePath(waveWidth, amplitude * 0.85, waveHeight, size);
  const frontWave = buildWavePath(waveWidth, amplitude, waveHeight - 1, size);

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <ClipPath id="plateWaterClip">
            <Circle cx={radius} cy={radius} r={radius - 0.5} />
          </ClipPath>
        </Defs>

        <Rect x={0} y={0} width={size} height={size} fill="#F8FBFF" />

        <G clipPath="url(#plateWaterClip)">
          <AnimatedG animatedProps={waterBodyProps}>
            <AnimatedG animatedProps={backWaveProps}>
              <Path d={backWave} fill={WATER_LIGHT} opacity={0.95} />
            </AnimatedG>
            <AnimatedG animatedProps={frontWaveProps}>
              <Path d={frontWave} fill={WATER_MID} />
            </AnimatedG>
            <Rect
              x={0}
              y={waveHeight}
              width={size}
              height={size}
              fill={WATER_DEEP}
            />
          </AnimatedG>
        </G>

        <Circle
          cx={radius}
          cy={radius}
          r={radius - 0.5}
          fill="none"
          stroke="#E2E8E4"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: "#F8FBFF",
  },
});
