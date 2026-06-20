import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NutritionIconKey, NutritionDashboardResponse } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  recommendations: NutritionDashboardResponse["recommendations"];
};

const ICON_MAP: Record<NutritionIconKey, keyof typeof MaterialCommunityIcons.glyphMap> = {
  apple: "food-apple",
  kiwi: "fruit-cherries",
  salad: "food-variant",
  egg: "egg",
  legumes: "seed",
  fish: "fish",
  broccoli: "leaf",
  pepper: "chili-medium",
  carrot: "carrot",
  water: "cup-water",
  carbs: "bread-slice",
  fat: "oil",
  fermented: "bacteria",
  prebiotic: "sprout",
};

export function RecommendationsCard({ recommendations }: Props) {
  const { items, impact } = recommendations;
  if (items.length === 0) return null;

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        What to try next
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Small additions based on today&apos;s gaps.
      </Text>

      <View style={styles.items}>
        {items.map((item) => (
          <View key={item.name} style={styles.item}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={ICON_MAP[item.icon] ?? "food"}
                size={18}
                color={semantic.primary}
              />
            </View>
            <Text variant="bodyLarge" style={styles.itemName}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {impact.length > 0 ? (
        <View style={styles.impact}>
          <Text variant="labelLarge" style={styles.impactLabel}>
            Potential impact
          </Text>
          {impact.map((row) => (
            <View key={row.label} style={styles.impactRow}>
              <Text variant="bodyMedium" style={styles.impactName}>
                {row.label}
              </Text>
              <Text variant="labelLarge" style={styles.impactDetail}>
                {row.detail}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { letterSpacing: 0.15, color: semantic.primary },
  subtitle: { opacity: 0.55, lineHeight: 18 },
  items: { gap: spacing.xs, marginTop: spacing.xs },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ui.selectedBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { flex: 1, letterSpacing: 0.1 },
  impact: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.borderSubtle,
  },
  impactLabel: {
    opacity: 0.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  impactName: { opacity: 0.75, flex: 1 },
  impactDetail: { color: semantic.primary, fontWeight: "600" },
});
