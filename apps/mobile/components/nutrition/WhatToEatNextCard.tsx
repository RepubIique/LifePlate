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
  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        What To Eat Next
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Based on today&apos;s intake:
      </Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <Text key={item.name} variant="bodyLarge" style={styles.item}>
            {index + 1}. {item.emoji} {item.name}
          </Text>
        ))}
      </View>
      {impact.length > 0 ? (
        <View style={styles.impact}>
          <Text variant="labelLarge" style={styles.impactLabel}>
            These would increase
          </Text>
          {impact.map((row) => (
            <Text key={row.label} variant="bodyMedium" style={styles.impactItem}>
              • {row.label} {row.detail}
            </Text>
          ))}
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.7, marginTop: spacing.xs, marginBottom: spacing.sm },
  list: { gap: spacing.xs },
  item: { lineHeight: 24 },
  impact: { marginTop: spacing.md, gap: 4 },
  impactLabel: { opacity: 0.55, letterSpacing: 0.6, textTransform: "uppercase" },
  impactItem: { opacity: 0.85, lineHeight: 20 },
});
