import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Rect } from "react-native-svg";
import { PILLAR_COLORS } from "@/lib/pillarTheme";

const WATER = PILLAR_COLORS.hydration;

type Props = {
  size: number;
  progress: number;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function PlateCenterWater({ size, progress }: Props) {
  const radius = size / 2;
  const fillHeight = size * clampProgress(progress);
  const waterTop = size - fillHeight;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <ClipPath id="plateWaterClip">
            <Circle cx={radius} cy={radius} r={radius - 0.5} />
          </ClipPath>
        </Defs>

        <Rect x={0} y={0} width={size} height={size} fill="#F8FBFF" />

        {fillHeight > 0 ? (
          <G clipPath="url(#plateWaterClip)">
            <Rect x={0} y={waterTop} width={size} height={fillHeight} fill={WATER} />
          </G>
        ) : null}

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
