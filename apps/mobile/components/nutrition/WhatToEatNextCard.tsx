import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FoodRecommendation, RecommendationImpact } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  items: FoodRecommendation[];
  impact: RecommendationImpact[];
};

export function WhatToEatNextCard({ items, impact }: Props) {
  if (items.length === 0) return null;

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        What to eat next
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Based on today&apos;s intake
      </Text>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.name} style={styles.row}>
            <View style={styles.rank}>
              <Text variant="labelLarge" style={styles.rankText}>
                {index + 1}
              </Text>
            </View>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <Text variant="bodyLarge" style={styles.itemName}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {impact.length > 0 ? (
        <View style={styles.impact}>
          <Text variant="labelLarge" style={styles.impactLabel}>
            These would boost
          </Text>
          <View style={styles.impactList}>
            {impact.map((row) => (
              <View key={row.label} style={styles.impactChip}>
                <Text variant="labelMedium" style={styles.impactChipText}>
                  {row.label} {row.detail}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.6 },
  list: { gap: spacing.sm, marginTop: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#F8FBF9",
    borderRadius: 14,
    padding: spacing.sm,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1B4332",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#FFFFFF", fontWeight: "700" },
  itemEmoji: { fontSize: 22 },
  itemName: { flex: 1, letterSpacing: 0.1 },
  impact: { gap: spacing.sm, marginTop: spacing.xs },
  impactLabel: {
    opacity: 0.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  impactList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  impactChip: {
    backgroundColor: "#D8F3DC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  impactChipText: { color: "#1B4332" },
});
