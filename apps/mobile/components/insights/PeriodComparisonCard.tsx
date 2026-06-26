import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import {
  buildComparisonSummary,
  formatScoreDelta,
  scoreDelta,
  type ComparisonPillarMetrics,
  type PeriodComparison,
} from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { PillarIcon } from "@/components/icons/PillarIcon";
import { useAppColors } from "@/context/ThemeContext";
import { PILLAR_COLORS } from "@/lib/pillarTheme";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { palette } from "@/src/theme/palette";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  comparison: PeriodComparison;
};

type ComparisonPillarKey = keyof ComparisonPillarMetrics;

const PILLAR_ROWS: Array<{ key: ComparisonPillarKey; label: string }> = [
  { key: "protein", label: "Protein" },
  { key: "fibre", label: "Fibre" },
  { key: "plants", label: "Plants" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fats" },
  { key: "hydration", label: "Hydration" },
];

function deltaColor(delta: number, { semantic }: AppColors): string {
  if (delta > 0) return semantic.primary;
  if (delta < 0) return palette.coral;
  return semantic.textMuted;
}

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: spacing.md },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    scoreCol: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    scoreLabel: {
      opacity: 0.55,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    scoreValue: {
      fontWeight: "700",
      letterSpacing: -0.5,
      color: semantic.primary,
    },
    scoreCaption: {
      opacity: 0.4,
    },
    muted: {
      opacity: 0.45,
    },
    deltaCol: {
      alignItems: "center",
      minWidth: 56,
      gap: 2,
    },
    vsLabel: {
      opacity: 0.4,
      letterSpacing: 0.3,
    },
    deltaValue: {
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    noBaseline: {
      opacity: 0.45,
      textAlign: "center",
      lineHeight: 18,
    },
    summary: {
      lineHeight: 22,
      opacity: 0.8,
      textAlign: "center",
    },
    pillarList: { gap: spacing.md },
    pillarRow: { gap: spacing.xs },
    pillarHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    pillarLabel: {
      flex: 1,
      letterSpacing: 0.1,
    },
    pillarDelta: {
      fontWeight: "600",
    },
    barTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: ui.trackBackground,
      overflow: "hidden",
      position: "relative",
    },
    barPrevious: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 5,
    },
    barCurrent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 5,
    },
    barLegend: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    barLegendText: {
      opacity: 0.45,
    },
    mealsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.borderSubtle,
    },
    mealsText: {
      opacity: 0.5,
    },
  });
}

function ScoreColumn({
  label,
  score,
  muted,
  styles,
}: {
  label: string;
  score: number;
  muted?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.scoreCol}>
      <Text variant="labelLarge" style={[styles.scoreLabel, muted && styles.muted]}>
        {label}
      </Text>
      <Text variant="headlineMedium" style={[styles.scoreValue, muted && styles.muted]}>
        {score}
      </Text>
      <Text variant="bodySmall" style={styles.scoreCaption}>
        score
      </Text>
    </View>
  );
}

function PillarComparisonRow({
  pillarKey,
  label,
  current,
  previous,
  showDelta,
  currentLabel,
  previousLabel,
  styles,
  colors,
}: {
  pillarKey: ComparisonPillarKey;
  label: string;
  current: number;
  previous: number;
  showDelta: boolean;
  currentLabel: string;
  previousLabel: string;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
}) {
  const color = PILLAR_COLORS[pillarKey];
  const delta = current - previous;

  return (
    <View style={styles.pillarRow}>
      <View style={styles.pillarHeader}>
        <PillarIcon pillar={pillarKey} color={color} size={28} variant="badge" />
        <Text variant="bodyLarge" style={styles.pillarLabel}>
          {label}
        </Text>
        {showDelta ? (
          <Text variant="labelLarge" style={[styles.pillarDelta, { color: deltaColor(delta, colors) }]}>
            {formatScoreDelta(delta)}%
          </Text>
        ) : null}
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barPrevious,
            { width: `${Math.max(0, Math.min(100, previous))}%`, backgroundColor: `${color}33` },
          ]}
        />
        <View
          style={[
            styles.barCurrent,
            { width: `${Math.max(0, Math.min(100, current))}%`, backgroundColor: color },
          ]}
        />
      </View>
      <View style={styles.barLegend}>
        <Text variant="bodySmall" style={styles.barLegendText}>
          {currentLabel} {current}%
        </Text>
        <Text variant="bodySmall" style={styles.barLegendText}>
          {previousLabel} {previous}%
        </Text>
      </View>
    </View>
  );
}

export function PeriodComparisonCard({ comparison }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppColors();
  const { current, previous } = comparison;
  const delta = scoreDelta(comparison);
  const summary = buildComparisonSummary(comparison);
  const showDelta = previous.hasData;
  const mealsCaption =
    comparison.period === "day"
      ? "logged today"
      : comparison.period === "week"
        ? "logged this week"
        : "logged this month";

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.scoreRow}>
        <ScoreColumn label={comparison.currentLabel} score={current.score} styles={styles} />
        <View style={styles.deltaCol}>
          {showDelta ? (
            <>
              <Text variant="labelLarge" style={styles.vsLabel}>
                vs
              </Text>
              <Text variant="titleLarge" style={[styles.deltaValue, { color: deltaColor(delta, colors) }]}>
                {formatScoreDelta(delta)}
              </Text>
            </>
          ) : (
            <Text variant="bodySmall" style={styles.noBaseline}>
              No data yet
            </Text>
          )}
        </View>
        <ScoreColumn label={comparison.previousLabel} score={previous.score} muted styles={styles} />
      </View>

      <Text variant="bodyMedium" style={styles.summary}>
        {summary}
      </Text>

      <View style={styles.pillarList}>
        {PILLAR_ROWS.map(({ key, label }) => (
          <PillarComparisonRow
            key={key}
            pillarKey={key}
            label={label}
            current={current.pillars[key]}
            previous={previous.pillars[key]}
            showDelta={showDelta}
            currentLabel={comparison.currentLabel}
            previousLabel={comparison.previousLabel}
            styles={styles}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.mealsRow}>
        <Text variant="bodySmall" style={styles.mealsText}>
          {current.mealsCount} meal{current.mealsCount === 1 ? "" : "s"} {mealsCaption}
        </Text>
        {previous.hasData ? (
          <Text variant="bodySmall" style={styles.mealsText}>
            {previous.mealsCount} {comparison.previousLabel.toLowerCase()}
          </Text>
        ) : null}
      </View>
    </PremiumCard>
  );
}
