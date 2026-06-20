import type { ReactElement } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
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
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22V10.5" stroke={color} strokeWidth={2} strokeLinecap="round" />

      <Path d="M12 20l-4 1.8c-1.1.5-.9-1 .2-1.6L12 18.5V20z" fill={color} />
      <Path d="M12 20l4 1.8c1.1.5.9-1-.2-1.6L12 18.5V20z" fill={color} />

      <Path d="M12 17l-3.2 1.4c-.9.4-.7-.7.3-1.1L12 16V17z" fill={color} />
      <Path d="M12 17l3.2 1.4c.9.4.7-.7-.3-1.1L12 16V17z" fill={color} />

      <Path d="M12 14.2l-2.8 1.1c-.8.3-.6-.6.4-.9L12 13.2V14.2z" fill={color} />
      <Path d="M12 14.2l2.8 1.1c.8.3.6-.6-.4-.9L12 13.2V14.2z" fill={color} />

      <Path d="M12 11.5l-2.3.9c-.7.3-.5-.5.5-.8L12 10.8V11.5z" fill={color} />
      <Path d="M12 11.5l2.3.9c.7.3.5-.5-.5-.8L12 10.8V11.5z" fill={color} />

      <Path d="M12 8.2l-1.8.7c-.6.2-.4-.4.4-.6L12 7.6V8.2z" fill={color} />
      <Path d="M12 8.2l1.8.7c.6.2.4-.4-.4-.6L12 7.6V8.2z" fill={color} />

      <Path d="M12 5.5L10.4 8.8c-.3.5.2.9.7.7L12 8.8l1.2.7c.5.2 1-.2.7-.7L12 5.5z" fill={color} />
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
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 19.5V9C4.5 5.6 7.8 3.5 11 3.5C13.8 3.5 16 4.8 17.4 7L19.8 11.2V19.5H4.5Z"
        fill={color}
      />
      <Path
        d="M7 9.5C7 7.2 8.6 5.6 10.8 5.3"
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.55}
      />
      <Path
        d="M10.5 13.8C11.5 13.3 12.5 13.3 13.5 13.8"
        stroke="#FFFFFF"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
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
