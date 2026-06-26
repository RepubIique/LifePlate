import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import type { MealShareRequestSummary } from "@lifeplate/shared";
import {
  buildMealPortionMeta,
  clampMealPortions,
  formatLogDateLabel,
  scaleMealForPortions,
} from "@lifeplate/shared";
import { SharedMealPortionsCard } from "@/components/SharedMealPortionsCard";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type PendingShareCardProps = {
  share: MealShareRequestSummary;
  busy: boolean;
  onAccept: (shareId: string, portionMeta?: ReturnType<typeof buildMealPortionMeta>) => void;
  onDecline: (shareId: string) => void;
};

export function PendingShareCard({ share, busy, onAccept, onDecline }: PendingShareCardProps) {
  const { semantic } = useAppColors();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      card: {
        gap: spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.semantic.primary,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.ui.selectedBackground,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 999,
      },
      badgeText: { color: colors.semantic.primary, fontWeight: "600", letterSpacing: 0.2 },
      date: { opacity: 0.5 },
      from: { color: colors.semantic.primary },
      content: {
        flexDirection: "row",
        gap: spacing.sm,
        alignItems: "center",
      },
      image: {
        width: 72,
        height: 72,
        borderRadius: 14,
      },
      imagePlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: colors.ui.cardBackground,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.ui.trackBackground,
      },
      details: { flex: 1, gap: 4 },
      mealName: { color: colors.semantic.primary, lineHeight: 22 },
      macros: { opacity: 0.65 },
      actions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
      },
      actionBtn: { flex: 1 },
    }),
  );

  const initialTotal = share.portionMeta?.totalPortions ?? 1;
  const initialEaten = share.portionMeta?.portionsEaten ?? 1;
  const baseMacros = share.portionMeta?.baseMacros ?? {
    estimatedCalories: share.calories ?? 0,
    protein: share.protein ?? 0,
    carbs: share.carbs ?? 0,
    fat: share.fat ?? 0,
    fibre: share.fibre ?? 0,
    sugar: share.sugar ?? 0,
    sodium: share.sodium ?? 0,
  };

  const [totalPortions, setTotalPortions] = useState(initialTotal);
  const [portionsEaten, setPortionsEaten] = useState(initialEaten);

  const scaled = useMemo(
    () => scaleMealForPortions(baseMacros, totalPortions, portionsEaten),
    [baseMacros, totalPortions, portionsEaten],
  );

  const hasImage = share.imageUrl.startsWith("http");

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.header}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="food-fork-drink" size={14} color={semantic.primary} />
          <Text variant="labelSmall" style={styles.badgeText}>
            Meal share
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.date}>
          {formatLogDateLabel(share.logDate)}
        </Text>
      </View>

      <Text variant="titleMedium" style={styles.from}>
        From {share.fromUserName}
      </Text>

      <View style={styles.content}>
        {hasImage ? (
          <Image source={{ uri: share.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={24} color={semantic.primary} />
          </View>
        )}
        <View style={styles.details}>
          <Text variant="titleMedium" style={styles.mealName} numberOfLines={2}>
            {share.mealName}
          </Text>
          <Text variant="bodySmall" style={styles.macros}>
            {scaled.estimatedCalories} kcal · {scaled.protein}g protein
          </Text>
        </View>
      </View>

      <SharedMealPortionsCard
        variant="edit"
        totalPortions={totalPortions}
        portionsEaten={portionsEaten}
        onTotalPortionsChange={(value) => {
          setTotalPortions(clampMealPortions(value));
          setPortionsEaten((prev) => Math.min(prev, value));
        }}
        onPortionsEatenChange={setPortionsEaten}
      />

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() =>
            onAccept(
              share.id,
              buildMealPortionMeta(
                baseMacros,
                totalPortions,
                portionsEaten,
              ),
            )
          }
          loading={busy}
          disabled={busy}
          style={styles.actionBtn}
        >
          Accept
        </Button>
        <Button
          mode="outlined"
          onPress={() => onDecline(share.id)}
          disabled={busy}
          style={styles.actionBtn}
        >
          Decline
        </Button>
      </View>
    </PremiumCard>
  );
}
