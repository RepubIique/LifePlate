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
import { spacing } from "@/src/theme/lifeplate";

type PendingShareCardProps = {
  share: MealShareRequestSummary;
  busy: boolean;
  onAccept: (shareId: string, portionMeta?: ReturnType<typeof buildMealPortionMeta>) => void;
  onDecline: (shareId: string) => void;
};

export function PendingShareCard({ share, busy, onAccept, onDecline }: PendingShareCardProps) {
  const initialTotal = share.portionMeta?.totalPortions ?? 2;
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
    <PremiumCard style={styles.card}>
      <Text variant="labelLarge" style={styles.from}>
        Shared by {share.fromUserName}
      </Text>
      <Text variant="bodySmall" style={styles.date}>
        {formatLogDateLabel(share.logDate)}
      </Text>

      <View style={styles.content}>
        {hasImage ? (
          <Image source={{ uri: share.imageUrl }} style={styles.image} />
        ) : null}
        <View style={styles.details}>
          <Text variant="titleMedium" style={styles.mealName}>
            {share.mealName}
          </Text>
          <Text variant="bodySmall" style={styles.macros}>
            {scaled.estimatedCalories} kcal · {scaled.protein}g protein
          </Text>
        </View>
      </View>

      {totalPortions > 1 ? (
        <SharedMealPortionsCard
          variant="edit"
          totalPortions={totalPortions}
          portionsEaten={portionsEaten}
          estimatedServings={share.portionMeta?.estimatedServings}
          onTotalPortionsChange={(value) => {
            setTotalPortions(clampMealPortions(value));
            setPortionsEaten((prev) => Math.min(prev, value));
          }}
          onPortionsEatenChange={setPortionsEaten}
        />
      ) : null}

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
                share.portionMeta?.estimatedServings,
              ),
            )
          }
          loading={busy}
          disabled={busy}
          style={styles.acceptBtn}
        >
          Accept
        </Button>
        <Button mode="outlined" onPress={() => onDecline(share.id)} disabled={busy}>
          Decline
        </Button>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  from: { color: "#1B4332" },
  date: { opacity: 0.55 },
  content: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  details: { flex: 1, gap: 4 },
  mealName: { color: "#1B4332" },
  macros: { opacity: 0.65 },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  acceptBtn: { marginTop: spacing.xs },
});
