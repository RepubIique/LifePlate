import { useEffect, useState, type ReactNode } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path, Rect } from "react-native-svg";
import { PILLAR_COLORS } from "@/lib/pillarTheme";
import { spacing } from "@/src/theme/lifeplate";

const AnimatedG = Animated.createAnimatedComponent(G);

const WATER_DEEP = PILLAR_COLORS.hydration;
const WATER_MID = "#6BAEF2";
const WATER_LIGHT = "#A8D8FF";
const GLASS_FILLED = "#6BAEF2";
const GLASS_EMPTY = "rgba(255, 255, 255, 0.92)";

type Props = {
  progress: number;
  total: number;
  filled: number;
  children: ReactNode;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildWavePath(
  width: number,
  amplitude: number,
  baseline: number,
  bodyHeight: number,
): string {
  const segment = width / 2;
  return (
    `M 0 ${baseline}` +
    ` C ${segment * 0.25} ${baseline - amplitude}, ${segment * 0.75} ${baseline + amplitude}, ${segment} ${baseline}` +
    ` C ${segment * 1.25} ${baseline - amplitude}, ${segment * 1.75} ${baseline + amplitude}, ${width} ${baseline}` +
    ` L ${width} ${baseline + bodyHeight} L 0 ${baseline + bodyHeight} Z`
  );
}

function HydrationWaterWaves({ width }: { width: number }) {
  const [height, setHeight] = useState(0);
  const amplitude = Math.max(4, width * 0.012);
  const waveHeight = amplitude * 2.2;
  const waveWidth = width * 2;
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [wavePhase]);

  const backWaveProps = useAnimatedProps(() => ({
    transform: [{ translateX: wavePhase.value * -width }],
  }));

  const frontWaveProps = useAnimatedProps(() => ({
    transform: [{ translateX: wavePhase.value * -width * 1.35 + width * 0.35 }],
  }));

  if (width <= 0 || height <= 0) {
    return (
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      />
    );
  }

  const backWave = buildWavePath(waveWidth, amplitude * 0.85, waveHeight, height);
  const frontWave = buildWavePath(waveWidth, amplitude, waveHeight - 1, height);
  const bodyHeight = Math.max(height - waveHeight, 0);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        if (next !== height) setHeight(next);
      }}
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedG animatedProps={backWaveProps}>
          <Path d={backWave} fill={WATER_LIGHT} opacity={0.95} />
        </AnimatedG>
        <AnimatedG animatedProps={frontWaveProps}>
          <Path d={frontWave} fill={WATER_MID} />
        </AnimatedG>
        {bodyHeight > 0 ? (
          <Rect x={0} y={waveHeight} width={width} height={bodyHeight} fill={WATER_DEEP} />
        ) : null}
      </Svg>
    </View>
  );
}

export function HydrationLevelFill({ progress, total, filled, children }: Props) {
  const [cupSize, setCupSize] = useState({ width: 0, height: 0 });
  const fill = useSharedValue(clampProgress(progress));

  useEffect(() => {
    fill.value = withSpring(clampProgress(progress), {
      damping: 18,
      stiffness: 110,
    });
  }, [fill, progress]);

  const waterStyle = useAnimatedStyle(() => ({
    height: cupSize.height * fill.value,
  }));

  function handleCupLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setCupSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }

  const showWater = cupSize.height > 0 && clampProgress(progress) > 0;

  return (
    <View style={styles.cup} onLayout={handleCupLayout}>
      {showWater ? (
        <Animated.View style={[styles.water, waterStyle]}>
          <HydrationWaterWaves width={cupSize.width} />
        </Animated.View>
      ) : null}

      <View style={styles.foreground}>
        {children}
        <View style={styles.glasses}>
          {Array.from({ length: total }, (_, i) => {
            const isFilled = i < filled;
            return (
              <View
                key={i}
                style={[
                  styles.glass,
                  isFilled ? styles.glassFilled : styles.glassEmpty,
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cup: {
    flex: 1,
    minHeight: 132,
    overflow: "hidden",
    backgroundColor: "#F8FBFF",
  },
  water: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  foreground: {
    flex: 1,
    zIndex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "space-between",
  },
  glasses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  glass: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  glassFilled: {
    backgroundColor: GLASS_FILLED,
    borderWidth: 1,
    borderColor: "#4A90D9",
  },
  glassEmpty: {
    backgroundColor: GLASS_EMPTY,
    borderWidth: 1.5,
    borderColor: "#C5D4E0",
  },
});
