import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import type { MealListItem, PillarProgress, ScoreStatus } from "@lifeplate/shared";
import { PillarInsightModal } from "@/components/home/PillarInsightModal";
import { PlateEmptyHeader, PlateStatusHeader } from "@/components/home/PlateStatusHeader";
import {
  pillarStatusHeadline,
  scoreStatusFromCompleteness,
} from "@/lib/dayStatusLabels";
import { fetchMealsFull } from "@/lib/api";
import { filterTodayMeals } from "@/lib/plantSources";
import { useRefreshMealsAndDashboard } from "@/lib/refreshAfterMealChange";
import { pillarColor } from "@/components/ui/pillarColors";
import { PILLAR_COLORS, type PillarKey } from "@/lib/pillarTheme";
import { spacing } from "@/src/theme/lifeplate";

const PLATE_SIZE = 220;
const STROKE = 14;
const OUTLINE_STROKE = 2;
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
  scoreStatus?: ScoreStatus;
  nutritionScore?: number;
  hasMeals?: boolean;
  plateMessage?: string | null;
  afterDinner?: boolean;
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

function PlateCenterWell({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={cx} cy={cy} r={outerR} fill="#FAFCFB" stroke="#E2E8E4" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={outerR * 0.72} fill="#FFFFFF" stroke="#EEF2F0" strokeWidth={1} />
    </Svg>
  );
}

function PlateCenterLabels({
  completeness,
  hasMeals,
  nutritionScore,
}: {
  completeness: number;
  hasMeals: boolean;
  nutritionScore?: number;
}) {
  return (
    <View style={styles.centerLabels} pointerEvents="none">
      <Text variant="headlineMedium" style={styles.centerValue}>
        {hasMeals ? `${completeness}%` : "—"}
      </Text>
      <Text variant="labelMedium" style={styles.centerCaption}>
        Today&apos;s plate
      </Text>
      {hasMeals && nutritionScore != null ? (
        <Text variant="labelSmall" style={styles.centerScore}>
          Score {nutritionScore}
        </Text>
      ) : null}
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

function LegendCard({
  pillar,
  color,
  onPress,
  afterDinner = false,
}: {
  pillar: PillarProgress;
  color: string;
  onPress: () => void;
  afterDinner?: boolean;
}) {
  const statusColor = pillarColor(pillar.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.legendCard, pressed && styles.legendCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pillar.label}, ${pillar.status}. Tap for details.`}
    >
      <View style={[styles.legendAccent, { backgroundColor: color }]} />
      <View style={styles.legendBody}>
        <Text variant="labelLarge" style={styles.legendName}>
          {pillar.label}
        </Text>
        <Text variant="labelSmall" style={[styles.legendStatus, { color: statusColor }]}>
          {pillarStatusHeadline(pillar.status, afterDinner)}
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
  scoreStatus,
  nutritionScore,
  hasMeals = true,
  plateMessage = null,
  afterDinner = false,
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
  const displayScoreStatus =
    scoreStatus ?? (hasMeals ? scoreStatusFromCompleteness(completeness) : undefined);

  const activeSection = sections.find((s) => s.key === activeKey) ?? null;

  const strokeWidth = STROKE;
  const radius = (PLATE_SIZE - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const quarter = circumference / 4;
  const cx = PLATE_SIZE / 2;
  const cy = PLATE_SIZE / 2;
  const innerRadius = radius - strokeWidth / 2 - 8;
  const innerDiameter = innerRadius * 2;

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
        {hasMeals && displayScoreStatus ? (
          <PlateStatusHeader status={displayScoreStatus} afterDinner={afterDinner} />
        ) : (
          <PlateEmptyHeader />
        )}

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
              styles.centerPlate,
              {
                width: innerDiameter,
                height: innerDiameter,
                left: cx - innerRadius,
                top: cy - innerRadius,
                borderRadius: innerRadius,
              },
            ]}
            pointerEvents="none"
          >
            <PlateCenterWell size={innerDiameter} />
            <PlateCenterLabels
              completeness={completeness}
              hasMeals={hasMeals}
              nutritionScore={nutritionScore}
            />
          </View>
        </View>

        {plateMessage ? (
          <Text variant="bodySmall" style={styles.message}>
            {plateMessage}
          </Text>
        ) : null}

        <View style={styles.legend}>
          {sections.map(({ key, pillar, color }) => (
            <LegendCard
              key={key}
              pillar={pillar}
              color={color}
              onPress={() => openPillar(key)}
              afterDinner={afterDinner}
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
    gap: spacing.md,
    width: "100%",
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
  centerPlate: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabels: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  centerValue: {
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#1B4332",
  },
  centerCaption: {
    opacity: 0.6,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  centerScore: {
    opacity: 0.45,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  message: {
    textAlign: "center",
    opacity: 0.55,
    lineHeight: 18,
    marginTop: -4,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: spacing.sm,
  },
  legendCard: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "48%",
    flexGrow: 1,
    minWidth: 148,
    backgroundColor: "#F8FBF9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F0",
    overflow: "hidden",
  },
  legendCardPressed: {
    backgroundColor: "#F1F7F3",
  },
  legendAccent: {
    width: 4,
  },
  legendBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  legendName: {
    color: "#1B4332",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  legendStatus: {
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
