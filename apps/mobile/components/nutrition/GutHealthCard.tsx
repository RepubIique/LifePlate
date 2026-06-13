import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { GutHealthSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList } from "./shared";

type Props = {
  gutHealth: GutHealthSummary;
};

function FoodGroup({
  label,
  foods,
  status,
}: {
  label: string;
  foods: string[];
  status: string;
}) {
  return (
    <View style={styles.group}>
      <Text variant="bodyLarge" style={styles.groupLabel}>
        {label}: {status}
      </Text>
      {foods.length > 0 ? (
        <BulletList items={foods} />
      ) : (
        <Text variant="bodyMedium" style={styles.empty}>
          None logged today
        </Text>
      )}
    </View>
  );
}

export function GutHealthCard({ gutHealth }: Props) {
  const fermentedStatus =
    gutHealth.fermentedFoods.length > 0 ? "✅" : "⚠️ None yet";
  const prebioticStatus =
    gutHealth.prebioticFoods.length >= 2
      ? "✅ Good"
      : gutHealth.prebioticFoods.length > 0
        ? "⚠️ Moderate"
        : "⚠️ Low";

  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        Gut Health
      </Text>
      <FoodGroup
        label="🦠 Fermented foods"
        foods={gutHealth.fermentedFoods}
        status={fermentedStatus}
      />
      <FoodGroup
        label="🌱 Prebiotic foods"
        foods={gutHealth.prebioticFoods}
        status={prebioticStatus}
      />
      <Text variant="titleMedium" style={styles.score}>
        Gut Score: {gutHealth.score}/10
      </Text>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15, marginBottom: spacing.sm },
  group: { marginBottom: spacing.md, gap: spacing.xs },
  groupLabel: { lineHeight: 24 },
  empty: { opacity: 0.65 },
  score: { marginTop: spacing.xs },
});
