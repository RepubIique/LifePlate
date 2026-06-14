import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle, G } from "react-native-svg";
import { DEFAULT_DAILY_FIBRE_G } from "@lifeplate/shared";
import {
  computeMacroBreakdown,
  energyUnitLabel,
  formatEnergyValue,
  type EnergyUnit,
} from "@/lib/macroMath";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

const MACRO_COLORS = {
  fibre: "#2D6A4F",
  protein: "#1B4332",
  carbs: "#40916C",
  fat: "#74C69D",
} as const;

const RING_SIZE = 168;
const STROKE = 14;

type Segment = { pct: number; color: string };

function MacroRing({
  calories,
  segments,
  energyUnit,
  onToggleEnergyUnit,
}: {
  calories: number;
  segments: Segment[];
  energyUnit: EnergyUnit;
  onToggleEnergyUnit?: () => void;
}) {
  const radius = (RING_SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  let offset = 0;
  const arcs = segments
    .filter((s) => s.pct > 0.001)
    .map((s, i) => {
      const length = circumference * s.pct;
      const dashArray = `${length} ${circumference - length}`;
      const dashOffset = -offset;
      offset += length;
      return (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          stroke={s.color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      );
    });

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#F1F3F5"
            strokeWidth={STROKE}
            fill="none"
          />
          {arcs}
        </G>
      </Svg>
      <View style={styles.ringCenter} pointerEvents="box-none">
        <Pressable
          onPress={onToggleEnergyUnit}
          disabled={!onToggleEnergyUnit}
          accessibilityRole="button"
          accessibilityLabel={`${formatEnergyValue(calories, energyUnit)} ${energyUnitLabel(energyUnit)}`}
          accessibilityHint={
            onToggleEnergyUnit ? "Tap to switch between kcal and kJ" : undefined
          }
          style={styles.energyTap}
        >
          <Text variant="headlineMedium" style={styles.calorieValue}>
            {formatEnergyValue(calories, energyUnit)}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.calorieLabel, onToggleEnergyUnit && styles.calorieLabelTappable]}
          >
            {energyUnitLabel(energyUnit)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MacroBar({
  label,
  grams,
  pct,
  color,
  maxGrams,
  subtitle,
}: {
  label: string;
  grams: number;
  pct?: number;
  color: string;
  maxGrams: number;
  subtitle?: string;
}) {
  const fill = maxGrams > 0 ? Math.min(1, grams / maxGrams) : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <View style={styles.barLabelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text variant="bodyMedium">{label}</Text>
        </View>
        <Text variant="titleMedium" style={styles.gramValue}>
          {Math.round(grams)}g
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(fill * 100, 2)}%`, backgroundColor: color },
          ]}
        />
      </View>
      {subtitle ? (
        <Text variant="bodySmall" style={styles.pctLabel}>
          {subtitle}
        </Text>
      ) : pct !== undefined ? (
        <Text variant="bodySmall" style={styles.pctLabel}>
          {Math.round(pct * 100)}% of macro energy
        </Text>
      ) : null}
    </View>
  );
}

function DetailStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <View style={styles.detailStat}>
      <Text variant="bodySmall" style={styles.detailLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.detailValue}>
        {Math.round(value)}
        <Text variant="bodySmall" style={styles.detailUnit}>
          {unit}
        </Text>
      </Text>
    </View>
  );
}

export function MacroNutritionPanel({
  calories,
  protein,
  carbs,
  fat,
  fibre = 0,
  sugar = 0,
  sodium = 0,
  dailyFibreGoal,
  personalisedGoal = false,
  confidence,
  showConfidence = false,
  energyUnitToggle = false,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
  sugar?: number;
  sodium?: number;
  dailyFibreGoal?: number;
  personalisedGoal?: boolean;
  confidence?: number;
  showConfidence?: boolean;
  energyUnitToggle?: boolean;
}) {
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kcal");
  const data = useMemo(
    () => computeMacroBreakdown(calories, protein, carbs, fat),
    [calories, protein, carbs, fat],
  );

  const fibreGoal = dailyFibreGoal ?? DEFAULT_DAILY_FIBRE_G;
  const fibrePctOfDay = fibreGoal > 0 ? Math.min(100, (fibre / fibreGoal) * 100) : 0;
  const fibreSubtitle = personalisedGoal
    ? `${Math.round(fibrePctOfDay)}% of your ${Math.round(fibreGoal)}g daily goal`
    : `${Math.round(fibrePctOfDay)}% of ${Math.round(fibreGoal)}g daily default · personalise in profile`;

  const segments: Segment[] = [
    { pct: data.proteinPct, color: MACRO_COLORS.protein },
    { pct: data.carbsPct, color: MACRO_COLORS.carbs },
    { pct: data.fatPct, color: MACRO_COLORS.fat },
  ];

  const maxGrams = Math.max(data.protein, data.carbs, data.fat, 1);

  return (
    <View style={styles.panel}>
      <MacroRing
        calories={data.calories}
        segments={segments}
        energyUnit={energyUnit}
        onToggleEnergyUnit={
          energyUnitToggle
            ? () => setEnergyUnit((unit) => (unit === "kcal" ? "kj" : "kcal"))
            : undefined
        }
      />

      <View style={styles.legend}>
        <LegendChip label="Fibre" color={MACRO_COLORS.fibre} />
        <LegendChip label="Protein" color={MACRO_COLORS.protein} />
        <LegendChip label="Carbs" color={MACRO_COLORS.carbs} />
        <LegendChip label="Fat" color={MACRO_COLORS.fat} />
      </View>

      <View style={styles.bars}>
        <MacroBar
          label="Fibre"
          grams={fibre}
          color={MACRO_COLORS.fibre}
          maxGrams={fibreGoal}
          subtitle={fibreSubtitle}
        />
        <MacroBar
          label="Protein"
          grams={data.protein}
          pct={data.proteinPct}
          color={MACRO_COLORS.protein}
          maxGrams={maxGrams}
        />
        <MacroBar
          label="Carbs"
          grams={data.carbs}
          pct={data.carbsPct}
          color={MACRO_COLORS.carbs}
          maxGrams={maxGrams}
        />
        <MacroBar
          label="Fat"
          grams={data.fat}
          pct={data.fatPct}
          color={MACRO_COLORS.fat}
          maxGrams={maxGrams}
        />
      </View>

      <View style={styles.detailsSection}>
        <Text variant="labelLarge" style={styles.detailsTitle}>
          More details
        </Text>
        <View style={styles.detailsGrid}>
          <DetailStat label="Sugar" value={sugar} unit="g" />
          <DetailStat label="Sodium" value={sodium} unit="mg" />
        </View>
      </View>

      {showConfidence && confidence !== undefined ? (
        <View style={styles.confidenceRow}>
          <Text variant="bodySmall" style={styles.confidenceLabel}>
            Analysis confidence
          </Text>
          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${Math.min(100, Math.max(0, confidence * 100))}%` },
              ]}
            />
          </View>
          <Text variant="labelLarge" style={styles.confidencePct}>
            {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function LegendChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendChip}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="bodySmall" style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  ringWrap: {
    alignSelf: "center",
    width: RING_SIZE,
    height: RING_SIZE,
    marginTop: spacing.xs,
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieValue: { fontWeight: "600", letterSpacing: -0.5 },
  calorieLabel: { opacity: 0.55, marginTop: -2 },
  calorieLabelTappable: { textDecorationLine: "underline" },
  energyTap: { alignItems: "center", justifyContent: "center", padding: spacing.xs },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  legendChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { opacity: 0.75 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bars: { gap: spacing.md },
  barRow: { gap: 6 },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  gramValue: { letterSpacing: 0.1 },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F1F3F5",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5 },
  pctLabel: { opacity: 0.5, fontSize: 12, lineHeight: 16 },
  detailsSection: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: premium.borderColor,
    gap: spacing.sm,
  },
  detailsTitle: {
    opacity: 0.55,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  detailStat: { flex: 1, gap: 2 },
  detailLabel: { opacity: 0.55 },
  detailValue: { letterSpacing: 0.1 },
  detailUnit: { opacity: 0.55 },
  confidenceRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: premium.borderColor,
    gap: spacing.xs,
  },
  confidenceLabel: { opacity: 0.55 },
  confidenceTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F1F3F5",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#40916C",
  },
  confidencePct: { alignSelf: "flex-end", opacity: 0.7 },
});
