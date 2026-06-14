import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { pillarColor } from "@/components/ui/pillarColors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList, DetailBlock, FoodChips } from "./shared";

type Props = {
  pillar: PillarProgress;
};

export function EssentialPillarCard({ pillar }: Props) {
  const fillColor = pillarColor(pillar.status);
  const serveLine = pillar.serves
    ? `${pillar.serves.current} / ${pillar.serves.target} serves`
    : null;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{pillar.emoji}</Text>
          <View style={styles.titleCol}>
            <Text variant="titleMedium" style={styles.title}>
              {pillar.label}
            </Text>
            {serveLine ? (
              <Text variant="bodySmall" style={styles.serves}>
                {serveLine}
              </Text>
            ) : null}
          </View>
        </View>
        <StatusBadge status={pillar.status} />
      </View>

      <View style={styles.metricRow}>
        <Text variant="headlineSmall" style={styles.consumed}>
          {pillar.consumed}
          <Text variant="titleMedium" style={styles.unit}>
            {pillar.unit === "g" ? "g" : ` ${pillar.unit}`}
          </Text>
        </Text>
        <Text variant="bodyMedium" style={styles.target}>
          of {pillar.target}
          {pillar.unit === "g" ? "g" : ` ${pillar.unit}`} target
        </Text>
      </View>

      <ProgressBar progress={pillar.progress} color={fillColor} height={8} />

      {pillar.sources && pillar.sources.length > 0 ? (
        <DetailBlock label="Today's sources">
          <FoodChips items={pillar.sources} />
        </DetailBlock>
      ) : null}

      {pillar.equivalents && pillar.equivalents.length > 0 ? (
        <DetailBlock label="Equivalent to">
          <BulletList items={pillar.equivalents} />
        </DetailBlock>
      ) : null}

      {pillar.stillNeeded && pillar.stillNeeded.length > 0 ? (
        <DetailBlock label="Still needed">
          <BulletList items={pillar.stillNeeded} />
        </DetailBlock>
      ) : null}

      {pillar.tip ? (
        <View style={styles.tipBox}>
          <Text variant="bodyMedium" style={styles.tip}>
            {pillar.tip}
          </Text>
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  emoji: { fontSize: 28 },
  titleCol: { flex: 1 },
  title: { letterSpacing: 0.15 },
  serves: { opacity: 0.55, marginTop: 2 },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  consumed: { fontWeight: "700", letterSpacing: -0.5 },
  unit: { opacity: 0.65, fontWeight: "400" },
  target: { opacity: 0.5 },
  tipBox: {
    backgroundColor: "#F8FBF9",
    borderRadius: 12,
    padding: spacing.sm,
  },
  tip: { lineHeight: 22, opacity: 0.85 },
});
