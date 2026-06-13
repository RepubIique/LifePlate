import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList, ProgressBlocks, statusEmoji } from "./shared";

type Props = {
  pillar: PillarProgress;
};

export function EssentialPillarCard({ pillar }: Props) {
  const serveLine = pillar.serves
    ? `${pillar.serves.current} / ${pillar.serves.target} serves`
    : null;

  return (
    <PremiumCard>
      <Text variant="titleMedium" style={styles.title}>
        {pillar.emoji} {pillar.label}
      </Text>
      {serveLine ? (
        <Text variant="headlineSmall" style={styles.serves}>
          {serveLine}
        </Text>
      ) : null}
      <Text variant="bodyLarge" style={styles.consumed}>
        {pillar.consumed}
        {pillar.unit === "g" ? "g" : ` ${pillar.unit}`} consumed
      </Text>
      <ProgressBlocks progress={pillar.progress} />
      {pillar.equivalents && pillar.equivalents.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Equivalent to
          </Text>
          <BulletList items={pillar.equivalents} />
        </View>
      ) : null}
      {pillar.stillNeeded && pillar.stillNeeded.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Still needed
          </Text>
          <BulletList items={pillar.stillNeeded} />
        </View>
      ) : null}
      {pillar.sources && pillar.sources.length > 0 ? (
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Today&apos;s sources
          </Text>
          <BulletList items={pillar.sources.map((s) => s)} />
        </View>
      ) : null}
      {pillar.tip ? (
        <Text variant="bodyMedium" style={styles.tip}>
          {statusEmoji(pillar.status)} {pillar.tip}
        </Text>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.15 },
  serves: { marginTop: spacing.xs },
  consumed: { opacity: 0.75, marginTop: 2, marginBottom: spacing.xs },
  section: { marginTop: spacing.md, gap: spacing.xs },
  sectionLabel: { opacity: 0.55, letterSpacing: 0.6, textTransform: "uppercase" },
  tip: { marginTop: spacing.md, lineHeight: 22, opacity: 0.85 },
});
