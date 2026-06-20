import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarProgress } from "@lifeplate/shared";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { pillarColorForLabel, pillarKeyFromLabel } from "@/lib/pillarTheme";
import { pillarStatusHeadline } from "@/lib/dayStatusLabels";
import { buildMacroSources } from "@/lib/macroSources";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { spacing } from "@/src/theme/lifeplate";
import { BulletList, DetailBlock, FoodChips } from "./shared";
import { PlantSourcesEditor } from "./PlantSourcesEditor";
import type { MealListItem } from "@lifeplate/shared";

type Props = {
  pillar: PillarProgress;
  hydrationHint?: string;
  todayMeals?: MealListItem[];
  onPlantSourcesChanged?: () => void;
};

export function PillarInsightContent({
  pillar,
  hydrationHint,
  todayMeals,
  onPlantSourcesChanged,
}: Props) {
  const fillColor = pillarColorForLabel(pillar.label);
  const sectionKey = pillarKeyFromLabel(pillar.label);
  const serveLine = pillar.serves
    ? `${pillar.serves.current} / ${pillar.serves.target} serves`
    : null;
  const pct = Math.round(Math.max(0, Math.min(1, pillar.progress)) * 100);

  const macroSources = useMemo(() => {
    if (!todayMeals) return [];
    if (pillar.label === "Protein") return buildMacroSources(todayMeals, "protein");
    if (pillar.label === "Fibre") return buildMacroSources(todayMeals, "fibre");
    if (pillar.label === "Carbs") return buildMacroSources(todayMeals, "carbs");
    return [];
  }, [pillar.label, todayMeals]);

  const sourceItems =
    pillar.label === "Protein" || pillar.label === "Fibre" || pillar.label === "Carbs"
      ? macroSources.length > 0
        ? macroSources
        : (pillar.sources ?? [])
      : (pillar.sources ?? []);

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <PillarIcon pillar={sectionKey} color={fillColor} size={36} variant="badge" />
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
        <Text variant="titleLarge" style={[styles.statusHeadline, { color: fillColor }]}>
          {pillarStatusHeadline(pillar.status)}
        </Text>
        <Text variant="bodyMedium" style={styles.metricDetail}>
          {pillar.consumed}
          {pillar.unit === "g" ? "g" : ` ${pillar.unit}`} of {pillar.target}
          {pillar.unit === "g" ? "g" : ` ${pillar.unit}`}
          {" · "}
          {pct}%
        </Text>
      </View>

      <ProgressBar progress={pillar.progress} color={fillColor} height={8} />

      {pillar.label === "Plants" && todayMeals && onPlantSourcesChanged ? (
        <PlantSourcesEditor meals={todayMeals} onChanged={onPlantSourcesChanged} />
      ) : pillar.label === "Protein" || pillar.label === "Fibre" || pillar.label === "Carbs" ? (
        <DetailBlock label="Today's sources">
          <FoodChips
            items={sourceItems}
            emptyLabel="Log meals with identifiable ingredients to see sources here."
          />
        </DetailBlock>
      ) : pillar.sources && pillar.sources.length > 0 ? (
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

      {hydrationHint ? (
        <Text variant="bodySmall" style={styles.hydrationHint}>
          {hydrationHint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
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
  titleCol: { flex: 1 },
  title: { letterSpacing: 0.15 },
  serves: { opacity: 0.55, marginTop: 2 },
  metricRow: {
    gap: 4,
  },
  statusHeadline: { fontWeight: "700", letterSpacing: -0.3 },
  metricDetail: { opacity: 0.55 },
  tipBox: {
    backgroundColor: "#F8FBF9",
    borderRadius: 12,
    padding: spacing.sm,
  },
  tip: { lineHeight: 22, opacity: 0.85 },
  hydrationHint: {
    opacity: 0.55,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
