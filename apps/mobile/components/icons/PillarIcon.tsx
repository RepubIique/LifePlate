import type { ReactElement } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import {
  PILLAR_COLORS,
  pillarKeyFromLabel,
  type PillarKey,
} from "@/lib/pillarTheme";
import { hexWithAlpha } from "@/lib/nutritionIcons";

type IconProps = {
  size?: number;
  color?: string;
};

type PillarIconProps = {
  pillar: PillarKey | string;
  size?: number;
  color?: string;
  variant?: "plain" | "badge";
  style?: ViewStyle;
};

function resolveKey(pillar: PillarKey | string): PillarKey {
  if (
    pillar === "protein" ||
    pillar === "fibre" ||
    pillar === "plants" ||
    pillar === "carbs" ||
    pillar === "fat" ||
    pillar === "hydration"
  ) {
    return pillar;
  }
  return pillarKeyFromLabel(pillar);
}

function ProteinIcon({ size = 20, color = PILLAR_COLORS.protein }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.8 5.8C2.8 8.8 3.2 13.5 6.2 15.8c2.4 2 6 1.6 7.8-.8 1.6-2.2 1.2-6.5-1.2-8.8C10.8 4.5 6.8 3.8 4.8 5.8z"
        fill={color}
      />
      <Path
        d="M12.5 14.2l5.2 5.5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M16.8 18.8h2.6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FibreIcon({ size = 20, color = PILLAR_COLORS.fibre }: IconProps) {
  const sw = 1.25;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21.5V9.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />

      <Path
        d="M12 20.5C8.5 19.8 5.8 17.2 5.5 14"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Path
        d="M12 20.5C15.5 19.8 18.2 17.2 18.5 14"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      <Ellipse
        cx={9.9}
        cy={19.2}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-34 9.9 19.2)"
      />
      <Ellipse
        cx={14.1}
        cy={19.2}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(34 14.1 19.2)"
      />
      <Path d="M8.6 17.6L7.3 15.8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.4 17.6L16.7 15.8" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse
        cx={9.6}
        cy={17.4}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-32 9.6 17.4)"
      />
      <Ellipse
        cx={14.4}
        cy={17.4}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(32 14.4 17.4)"
      />
      <Path d="M8.2 15.8L6.9 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.8 15.8L17.1 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse
        cx={9.4}
        cy={15.6}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-30 9.4 15.6)"
      />
      <Ellipse
        cx={14.6}
        cy={15.6}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(30 14.6 15.6)"
      />
      <Path d="M8 14L6.7 12.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M16 14L17.3 12.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse
        cx={9.3}
        cy={13.8}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-28 9.3 13.8)"
      />
      <Ellipse
        cx={14.7}
        cy={13.8}
        rx={1.1}
        ry={2.15}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(28 14.7 13.8)"
      />
      <Path d="M7.9 12.2L6.6 10.4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M16.1 12.2L17.4 10.4" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse
        cx={9.4}
        cy={12}
        rx={1.05}
        ry={2.1}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-26 9.4 12)"
      />
      <Ellipse
        cx={14.6}
        cy={12}
        rx={1.05}
        ry={2.1}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(26 14.6 12)"
      />
      <Path d="M8 10.4L6.8 8.7" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M16 10.4L17.2 8.7" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse
        cx={9.8}
        cy={10.2}
        rx={1}
        ry={2}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(-24 9.8 10.2)"
      />
      <Ellipse
        cx={14.2}
        cy={10.2}
        rx={1}
        ry={2}
        stroke={color}
        strokeWidth={sw}
        fill="none"
        transform="rotate(24 14.2 10.2)"
      />
      <Path d="M8.5 8.7L7.4 7.1" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M15.5 8.7L16.6 7.1" stroke={color} strokeWidth={sw} strokeLinecap="round" />

      <Ellipse cx={12} cy={8.6} rx={0.95} ry={1.9} stroke={color} strokeWidth={sw} fill="none" />
      <Path d="M12 7V4.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

function PlantsIcon({ size = 20, color = PILLAR_COLORS.plants }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C15.5 4 18.5 7 19 11C19.5 15 17 18.5 12 21C7 18.5 4.5 15 5 11C5.5 7 8.5 4 12 3Z"
        fill={color}
      />
      <Path
        d="M12 6.5V18.5"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Path
        d="M12 11C10 10 8.5 9 7.5 7.5M12 14C14 13 15.5 12 16.5 10.5"
        stroke="#FFFFFF"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Path
        d="M12 21V22.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HydrationIcon({ size = 20, color = PILLAR_COLORS.hydration }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5c0 0-5.5 6.8-5.5 10.3a5.5 5.5 0 1011 0C17.5 10.3 12 3.5 12 3.5z"
        fill={color}
      />
      <Path
        d="M10.2 14.8c.8 1.1 1.9 1.7 3.2 1.7"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
}

function CarbsIcon({ size = 20, color = PILLAR_COLORS.carbs }: IconProps) {
  const sw = 1.55;
  const cap = "round";
  const join = "round";

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 14.2C3.8 14.2 3.2 13.5 3.2 12.5C3.2 8.5 7 5.8 12 5.8C17 5.8 20.8 8.5 20.8 12.5C20.8 13.5 20.2 14.2 19.5 14.2H4.5Z"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap={cap}
        strokeLinejoin={join}
      />
      <Path
        d="M8.8 10.2L9.5 8.4L10.2 10.2"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap={cap}
        strokeLinejoin={join}
      />
      <Path
        d="M11.5 9.7L12 7.8L12.5 9.7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap={cap}
        strokeLinejoin={join}
      />
      <Path
        d="M14.8 10.2L15.5 8.4L16.2 10.2"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap={cap}
        strokeLinejoin={join}
      />
    </Svg>
  );
}

function FatIcon({ size = 20, color = PILLAR_COLORS.fat }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.5c-3.2 4.8-5 8.4-5 11.2a5 5 0 1010 0c0-2.8-1.8-6.4-5-11.2z"
        fill={color}
      />
      <Path
        d="M10.5 14.2c.7.9 1.6 1.4 2.7 1.4"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
}

const ICONS: Record<PillarKey, (props: IconProps) => ReactElement> = {
  protein: ProteinIcon,
  fibre: FibreIcon,
  plants: PlantsIcon,
  carbs: CarbsIcon,
  fat: FatIcon,
  hydration: HydrationIcon,
};

export function PillarIcon({
  pillar,
  size = 20,
  color,
  variant = "plain",
  style,
}: PillarIconProps) {
  const key = resolveKey(pillar);
  const tint = color ?? PILLAR_COLORS[key];
  const Icon = ICONS[key];
  const iconSize = variant === "badge" ? Math.round(size * 0.62) : size;

  if (variant === "badge") {
    return (
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: hexWithAlpha(tint, 0.12),
          },
          style,
        ]}
      >
        <Icon size={iconSize} color={tint} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Icon size={size} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
