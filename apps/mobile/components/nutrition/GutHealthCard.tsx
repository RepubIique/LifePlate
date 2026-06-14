import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { GutHealthSummary } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { pillarColor } from "@/components/ui/pillarColors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";
import { FoodChips } from "./shared";

type Props = {
  gutHealth: GutHealthSummary;
};

function FoodGroup({
  emoji,
  label,
  foods,
  status,
  statusLabel,
}: {
  emoji: string;
  label: string;
  foods: string[];
  status: GutHealthSummary["status"];
  statusLabel: string;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text variant="titleSmall" style={styles.groupTitle}>
          {emoji} {label}
        </Text>
        <StatusBadge status={status} label={statusLabel} />
      </View>
      <FoodChips items={foods} emptyLabel="None logged today" />
    </View>
  );
}

export function GutHealthCard({ gutHealth }: Props) {
  const scoreProgress = gutHealth.score / 10;
  const fillColor = pillarColor(gutHealth.status);

  const fermentedLabel =
    gutHealth.fermentedFoods.length > 0 ? "Logged" : "None yet";
  const prebioticLabel =
    gutHealth.prebioticFoods.length >= 2
      ? "Good variety"
      : gutHealth.prebioticFoods.length > 0
        ? "Moderate"
        : "Low";

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.scoreHeader}>
        <View>
          <Text variant="titleMedium" style={styles.title}>
            Gut health
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Fermented & prebiotic foods today
          </Text>
        </View>
        <View style={styles.scoreCol}>
          <Text variant="headlineMedium" style={[styles.score, { color: fillColor }]}>
            {gutHealth.score}
          </Text>
          <Text variant="labelMedium" style={styles.scoreOf}>
            / 10
          </Text>
        </View>
      </View>

      <ProgressBar progress={scoreProgress} color={fillColor} height={8} />

      <FoodGroup
        emoji="🦠"
        label="Fermented"
        foods={gutHealth.fermentedFoods}
        status={gutHealth.fermentedFoods.length > 0 ? "good" : "low"}
        statusLabel={fermentedLabel}
      />

      <FoodGroup
        emoji="🌱"
        label="Prebiotic"
        foods={gutHealth.prebioticFoods}
        status={
          gutHealth.prebioticFoods.length >= 2
            ? "good"
            : gutHealth.prebioticFoods.length > 0
              ? "moderate"
              : "low"
        }
        statusLabel={prebioticLabel}
      />
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { letterSpacing: 0.15 },
  subtitle: { opacity: 0.55, marginTop: 2 },
  scoreCol: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  score: { fontWeight: "700", letterSpacing: -0.5 },
  scoreOf: { opacity: 0.45 },
  group: { gap: spacing.sm },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: { letterSpacing: 0.1 },
});
