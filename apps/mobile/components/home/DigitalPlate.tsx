import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import type { MealListItem, PillarProgress } from "@lifeplate/shared";
import { PillarInsightModal } from "@/components/home/PillarInsightModal";
import { PlateCenterWater } from "@/components/home/PlateCenterWater";
import { fetchMealsFull } from "@/lib/api";
import { filterTodayMeals } from "@/lib/plantSources";
import { useRefreshMealsAndDashboard } from "@/lib/refreshAfterMealChange";
import { PILLAR_COLORS, type PillarKey } from "@/lib/pillarTheme";
import { spacing } from "@/src/theme/lifeplate";

const PLATE_SIZE = 196;
const STROKE = 16;
const OUTLINE_STROKE = 3;
const PLATE_SECTION_COLORS = PILLAR_COLORS;
const QUARTER = PLATE_SIZE / 2;

type PlatePillarKey = Exclude<PillarKey, "hydration">;

type PlateSection = {
  key: PlatePillarKey;
  pillar: PillarProgress;
  rotation: number;
  color: string;
  hitStyle: object;
};

type Props = {
  protein: PillarProgress;
  fibre: PillarProgress;
  plants: PillarProgress;
  carbs: PillarProgress;
  hydration: PillarProgress;
  nutritionScore?: number;
  hasMeals?: boolean;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function plateCompleteness(sections: PillarProgress[]) {
  if (sections.length === 0) return 0;
  const avg =
    sections.reduce((sum, section) => sum + clampProgress(section.progress), 0) /
    sections.length;
  return Math.round(avg * 100);
}

function plateMessage(completeness: number, hasMeals: boolean) {
  if (!hasMeals) return "Log a meal to start filling your plate";
  if (completeness >= 100) return "Your plate is complete today";
  if (completeness >= 75) return "Nearly there — great progress";
  if (completeness >= 50) return "Your plate is halfway there";
  return "Room to grow — every meal counts";
}

function waterSurfaceY(plateSize: number, innerDiameter: number, innerRadius: number, progress: number) {
  const cy = plateSize / 2;
  return cy - innerRadius + innerDiameter * (1 - clampProgress(progress));
}

function PlateCenterLabels({
  plateSize,
  waterY,
  completeness,
  hasMeals,
  hydration,
  nutritionScore,
}: {
  plateSize: number;
  waterY: number;
  completeness: number;
  hasMeals: boolean;
  hydration: PillarProgress;
  nutritionScore?: number;
}) {
  const content = (variant: "above" | "below") => (
    <>
      <Text
        variant="headlineMedium"
        style={variant === "below" ? styles.completenessUnderwater : styles.completeness}
      >
        {hasMeals ? `${completeness}%` : "—"}
      </Text>
      <Text
        variant="labelMedium"
        style={variant === "below" ? styles.centerLabelUnderwater : styles.centerLabel}
      >
        Today&apos;s plate
      </Text>
      <Text
        variant="labelSmall"
        style={variant === "below" ? styles.hydrationHintUnderwater : styles.hydrationHint}
      >
        {hydration.consumed}/{hydration.target} glasses
      </Text>
      {nutritionScore != null && hasMeals ? (
        <Text
          variant="labelSmall"
          style={variant === "below" ? styles.scoreHintUnderwater : styles.scoreHint}
        >
          Score {nutritionScore}
        </Text>
      ) : null}
    </>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[styles.centerClip, { top: waterY }]}
      >
        <View style={[styles.center, { top: -waterY, height: plateSize }]}>
          {content("below")}
        </View>
      </View>
      <View style={[styles.centerClip, { height: waterY }]}>
        <View style={[styles.center, { height: plateSize }]}>
          {content("above")}
        </View>
      </View>
    </View>
  );
}

function QuadrantArc({
  progress,
  rotation,
  color,
  radius,
  circumference,
  quarter,
  cx,
  cy,
}: {
  progress: number;
  rotation: number;
  color: string;
  radius: number;
  circumference: number;
  quarter: number;
  cx: number;
  cy: number;
}) {
  const dash = `${quarter} ${circumference - quarter}`;
  const fillLen = quarter * clampProgress(progress);
  const outlineWidth = STROKE + OUTLINE_STROKE * 2;

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#FFFFFF"
        strokeWidth={outlineWidth}
        fill="none"
        strokeDasharray={dash}
        strokeLinecap="round"
        rotation={rotation}
        origin={`${cx}, ${cy}`}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="#EEF2F0"
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={dash}
        strokeLinecap="round"
        rotation={rotation}
        origin={`${cx}, ${cy}`}
      />
      {fillLen > 0 ? (
        <>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#FFFFFF"
            strokeWidth={outlineWidth}
            fill="none"
            strokeDasharray={`${fillLen} ${circumference}`}
            strokeLinecap="round"
            rotation={rotation}
            origin={`${cx}, ${cy}`}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${fillLen} ${circumference}`}
            strokeLinecap="round"
            rotation={rotation}
            origin={`${cx}, ${cy}`}
          />
        </>
      ) : null}
    </>
  );
}

function LegendItem({
  pillar,
  color,
  onPress,
}: {
  pillar: PillarProgress;
  color: string;
  onPress: () => void;
}) {
  const pct = Math.round(clampProgress(pillar.progress) * 100);

  return (
    <Pressable
      style={({ pressed }) => [styles.legendItem, pressed && styles.legendItemPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pillar.label}, ${pct} percent. Tap for details.`}
    >
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendText}>
        <Text variant="labelMedium" style={styles.legendLabel} numberOfLines={1}>
          {pillar.label}
        </Text>
        <Text variant="labelLarge" style={[styles.legendPct, { color }]}>
          {pct}%
        </Text>
      </View>
    </Pressable>
  );
}

export function DigitalPlate({
  protein,
  fibre,
  plants,
  carbs,
  hydration,
  nutritionScore,
  hasMeals = true,
}: Props) {
  const [activeKey, setActiveKey] = useState<PlatePillarKey | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealListItem[]>([]);
  const refreshMealsAndDashboard = useRefreshMealsAndDashboard();

  const loadTodayMeals = useCallback(async () => {
    const meals = await fetchMealsFull();
    setTodayMeals(filterTodayMeals(meals));
  }, []);

  useEffect(() => {
    if (activeKey == null) return;
    void loadTodayMeals();
  }, [activeKey, loadTodayMeals]);

  const handlePlantSourcesChanged = useCallback(() => {
    refreshMealsAndDashboard();
    void loadTodayMeals();
  }, [loadTodayMeals, refreshMealsAndDashboard]);

  const sections: PlateSection[] = useMemo(
    () => [
      {
        key: "protein",
        pillar: protein,
        rotation: -90,
        color: PLATE_SECTION_COLORS.protein,
        hitStyle: styles.hitTopRight,
      },
      {
        key: "fibre",
        pillar: fibre,
        rotation: 0,
        color: PLATE_SECTION_COLORS.fibre,
        hitStyle: styles.hitBottomRight,
      },
      {
        key: "plants",
        pillar: plants,
        rotation: 90,
        color: PLATE_SECTION_COLORS.plants,
        hitStyle: styles.hitBottomLeft,
      },
      {
        key: "carbs",
        pillar: carbs,
        rotation: 180,
        color: PLATE_SECTION_COLORS.carbs,
        hitStyle: styles.hitTopLeft,
      },
    ],
    [protein, fibre, plants, carbs],
  );

  const pillars = useMemo(
    () => [protein, fibre, plants, carbs],
    [protein, fibre, plants, carbs],
  );
  const completeness = plateCompleteness(pillars);
  const message = plateMessage(completeness, hasMeals);

  const activeSection = sections.find((s) => s.key === activeKey) ?? null;

  const strokeWidth = STROKE;
  const radius = (PLATE_SIZE - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const quarter = circumference / 4;
  const cx = PLATE_SIZE / 2;
  const cy = PLATE_SIZE / 2;
  const innerRadius = radius - strokeWidth / 2 - 6;
  const innerDiameter = innerRadius * 2;
  const hydrationProgress = clampProgress(hydration.progress);
  const waterY = waterSurfaceY(PLATE_SIZE, innerDiameter, innerRadius, hydrationProgress);

  function openPillar(key: PlatePillarKey) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveKey(key);
  }

  function closePillar() {
    setActiveKey(null);
  }

  return (
    <>
      <View style={styles.wrap}>
        <View style={[styles.plateWrap, { width: PLATE_SIZE, height: PLATE_SIZE }]}>
          <Svg width={PLATE_SIZE} height={PLATE_SIZE} pointerEvents="none">
            {sections.map(({ key, pillar, rotation, color }) => (
              <QuadrantArc
                key={key}
                progress={pillar.progress}
                rotation={rotation}
                color={color}
                radius={radius}
                circumference={circumference}
                quarter={quarter}
                cx={cx}
                cy={cy}
              />
            ))}
          </Svg>

          {sections.map(({ key, hitStyle }) => (
            <Pressable
              key={`hit-${key}`}
              style={[styles.quarterHit, hitStyle]}
              onPress={() => openPillar(key)}
              accessibilityRole="button"
              accessibilityLabel={`View ${key} insight`}
            />
          ))}

          <View
            style={[
              styles.centerWater,
              {
                width: innerDiameter,
                height: innerDiameter,
                left: cx - innerRadius,
                top: cy - innerRadius,
              },
            ]}
            pointerEvents="none"
          >
            <PlateCenterWater size={innerDiameter} progress={hydrationProgress} />
          </View>

          <PlateCenterLabels
            plateSize={PLATE_SIZE}
            waterY={waterY}
            completeness={completeness}
            hasMeals={hasMeals}
            hydration={hydration}
            nutritionScore={nutritionScore}
          />
        </View>

        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>

        <Text variant="labelMedium" style={styles.tapHint}>
          Tap a section for details
        </Text>

        <View style={styles.legend}>
          {sections.map(({ key, pillar, color }) => (
            <LegendItem
              key={key}
              pillar={pillar}
              color={color}
              onPress={() => openPillar(key)}
            />
          ))}
        </View>
      </View>

      <PillarInsightModal
        visible={activeKey != null}
        pillar={activeSection?.pillar ?? null}
        todayMeals={
          activeKey === "plants" ||
          activeKey === "protein" ||
          activeKey === "fibre" ||
          activeKey === "carbs"
            ? todayMeals
            : undefined
        }
        onPlantSourcesChanged={activeKey === "plants" ? handlePlantSourcesChanged : undefined}
        onClose={closePillar}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  plateWrap: {
    position: "relative",
  },
  quarterHit: {
    position: "absolute",
  },
  hitTopRight: {
    top: 0,
    left: QUARTER,
    width: QUARTER,
    height: QUARTER,
  },
  hitBottomRight: {
    top: QUARTER,
    left: QUARTER,
    width: QUARTER,
    height: QUARTER,
  },
  hitBottomLeft: {
    top: QUARTER,
    left: 0,
    width: QUARTER,
    height: QUARTER,
  },
  hitTopLeft: {
    top: 0,
    left: 0,
    width: QUARTER,
    height: QUARTER,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  centerClip: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  centerWater: {
    position: "absolute",
  },
  completeness: {
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#1B4332",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  completenessUnderwater: {
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#1B4332",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  centerLabel: {
    opacity: 0.65,
    letterSpacing: 0.4,
    marginTop: 2,
    textShadowColor: "rgba(255, 255, 255, 0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  centerLabelUnderwater: {
    opacity: 0.65,
    letterSpacing: 0.4,
    marginTop: 2,
    textShadowColor: "rgba(255, 255, 255, 0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  hydrationHint: {
    opacity: 0.65,
    marginTop: 4,
    letterSpacing: 0.2,
    textShadowColor: "rgba(255, 255, 255, 0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  hydrationHintUnderwater: {
    opacity: 0.65,
    marginTop: 4,
    letterSpacing: 0.2,
    textShadowColor: "rgba(255, 255, 255, 0.85)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  scoreHint: {
    opacity: 0.45,
    marginTop: 4,
  },
  scoreHintUnderwater: {
    opacity: 0.45,
    marginTop: 4,
  },
  message: {
    textAlign: "center",
    opacity: 0.75,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  tapHint: {
    opacity: 0.4,
    letterSpacing: 0.3,
    marginTop: -4,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: "47%",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  legendItemPressed: {
    backgroundColor: "#F8FBF9",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  legendLabel: {
    flex: 1,
    opacity: 0.7,
  },
  legendPct: {
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
});
