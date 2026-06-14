import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { NutritionIconKey } from "@lifeplate/shared";
import { hexWithAlpha, resolveNutritionIconKey } from "@/lib/nutritionIcons";
import { StyleSheet, View, type ViewStyle } from "react-native";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const NUTRITION_ICON_MAP: Record<NutritionIconKey, IconName> = {
  apple: "food-apple",
  kiwi: "fruit-citrus",
  salad: "bowl-mix-outline",
  egg: "egg",
  legumes: "seed-outline",
  fish: "fish",
  broccoli: "sprout",
  pepper: "food-variant",
  carrot: "carrot",
  water: "cup-water",
  carbs: "lightning-bolt-outline",
  fat: "peanut-outline",
  fermented: "bacteria-outline",
  prebiotic: "flower-outline",
};

const ICON_COLORS: Record<NutritionIconKey, string> = {
  apple: "#E76F51",
  kiwi: "#52B788",
  salad: "#40916C",
  egg: "#E9A319",
  legumes: "#8B5E3C",
  fish: "#4895EF",
  broccoli: "#52B788",
  pepper: "#E76F51",
  carrot: "#E9A319",
  water: "#4895EF",
  carbs: "#E9A319",
  fat: "#1B4332",
  fermented: "#40916C",
  prebiotic: "#52B788",
};

type Props = {
  icon: NutritionIconKey | undefined;
  emoji?: string;
  size?: number;
  color?: string;
  variant?: "plain" | "badge";
  style?: ViewStyle;
};

export function NutritionIcon({
  icon,
  emoji,
  size = 22,
  color,
  variant = "plain",
  style,
}: Props) {
  const key = resolveNutritionIconKey(icon, emoji);
  const tint = color ?? ICON_COLORS[key];
  const glyph = NUTRITION_ICON_MAP[key] ?? "food";
  const iconSize = variant === "badge" ? Math.max(16, Math.round(size * 0.55)) : size;

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
        <MaterialCommunityIcons name={glyph} size={iconSize} color={tint} />
      </View>
    );
  }

  return (
    <View style={style}>
      <MaterialCommunityIcons name={glyph} size={iconSize} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
