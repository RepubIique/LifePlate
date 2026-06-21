import {
  Button,
  Circle,
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonBorderShape,
  buttonStyle,
  containerBackground,
  controlSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  progressViewStyle,
  shapes,
  tint,
  accessibilityLabel,
  labelStyle,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { DigitalPlateWidgetProps } from "@lifeplate/shared";

const DigitalPlateWidget = (props: DigitalPlateWidgetProps, environment: WidgetEnvironment) => {
  "widget";

  // Must be inlined — widget runtime cannot resolve @lifeplate/shared exports.
  // Keep in sync with WIDGET_LOG_CAMERA_TARGET in packages/shared/src/widgetPlate.ts
  const logCameraTarget = "log-camera";

  const cream = "#FAF6F0";
  const sageLight = "#E8EDE0";
  const forest = "#3E5641";
  const muted = "#5E7D8A";
  const protein = "#F07167";
  const fibre = "#FFD07B";
  const plants = "#A3B18A";
  const carbs = "#C46A4A";

  const compact = environment.levelOfDetail === "simplified";
  const margins = environment.widgetContentMargins;
  const padH = margins ? Math.max(8, margins.leading) : compact ? 10 : 12;
  const padV = margins ? Math.max(6, margins.top) : compact ? 8 : 10;

  const shell = [
    containerBackground(cream, "widget"),
    padding({ horizontal: padH, vertical: padV }),
  ];

  if (!props.isPaid) {
    return (
      <VStack alignment="center" spacing={compact ? 6 : 8} modifiers={shell}>
        <Image systemName="circle.grid.2x2.fill" color={forest} size={compact ? 24 : 30} />
        <Text modifiers={[font({ weight: "bold", size: compact ? 14 : 16 }), foregroundStyle(forest)]}>
          LifePlate Plus
        </Text>
        <Text
          modifiers={[
            font({ size: compact ? 11 : 12 }),
            foregroundStyle(muted),
            padding({ horizontal: 8 }),
            lineLimit(2),
          ]}
        >
          Pin your Digital Plate to your home screen with Plus.
        </Text>
      </VStack>
    );
  }

  const completenessLabel = props.hasMeals ? `${props.completeness}%` : "—";
  const proteinPct = Math.round(props.protein * 100);
  const fibrePct = Math.round(props.fibre * 100);
  const plantsPct = Math.round(props.plants * 100);
  const carbsPct = Math.round(props.carbs * 100);

  const rowGap = compact ? 3 : 4;
  const barHeight = compact ? 3 : 4;
  const labelSize = compact ? 9 : 10;
  const pctSize = compact ? 10 : 11;
  const summaryWidth = compact ? 76 : 86;
  const heroMediumSize = compact ? 26 : 30;

  return (
    <HStack alignment="center" spacing={compact ? 8 : 10} modifiers={shell}>
      <VStack alignment="center" spacing={compact ? 4 : 5} modifiers={[frame({ width: summaryWidth })]}>
        <Text modifiers={[font({ size: 9, weight: "semibold" }), foregroundStyle(muted), lineLimit(1)]}>
          TODAY&apos;S PLATE
        </Text>
        <Text
          modifiers={[
            font({ weight: "bold", size: heroMediumSize }),
            foregroundStyle(forest),
            minimumScaleFactor(0.7),
            lineLimit(1),
          ]}
        >
          {completenessLabel}
        </Text>
        {props.hasMeals && props.nutritionScore != null && !compact ? (
          <Text
            modifiers={[
              font({ size: 9, weight: "semibold" }),
              foregroundStyle(forest),
              padding({ horizontal: 6, vertical: 2 }),
              background(sageLight, shapes.capsule()),
              lineLimit(1),
            ]}
          >
            Score {props.nutritionScore}
          </Text>
        ) : null}
        <Button
          target={logCameraTarget}
          systemImage="camera.fill"
          label="Log meal"
          modifiers={[
            buttonStyle("borderedProminent"),
            controlSize("small"),
            tint(forest),
            buttonBorderShape("capsule"),
            labelStyle("iconOnly"),
            accessibilityLabel("Log meal"),
          ]}
        />
      </VStack>

      <VStack spacing={rowGap} modifiers={[frame({ maxWidth: Infinity })]}>
        <VStack spacing={2}>
          <HStack spacing={4} alignment="center">
            <Circle modifiers={[frame({ width: 5, height: 5 }), foregroundStyle(protein)]} />
            <Text modifiers={[font({ size: labelSize, weight: "medium" }), foregroundStyle(muted), lineLimit(1)]}>
              Protein
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: pctSize, weight: "bold" }), foregroundStyle(protein), lineLimit(1)]}>
              {proteinPct}%
            </Text>
          </HStack>
          <ProgressView
            value={props.protein}
            modifiers={[progressViewStyle("linear"), tint(protein), frame({ height: barHeight })]}
          />
        </VStack>

        <VStack spacing={2}>
          <HStack spacing={4} alignment="center">
            <Circle modifiers={[frame({ width: 5, height: 5 }), foregroundStyle(fibre)]} />
            <Text modifiers={[font({ size: labelSize, weight: "medium" }), foregroundStyle(muted), lineLimit(1)]}>
              Fibre
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: pctSize, weight: "bold" }), foregroundStyle(fibre), lineLimit(1)]}>
              {fibrePct}%
            </Text>
          </HStack>
          <ProgressView
            value={props.fibre}
            modifiers={[progressViewStyle("linear"), tint(fibre), frame({ height: barHeight })]}
          />
        </VStack>

        <VStack spacing={2}>
          <HStack spacing={4} alignment="center">
            <Circle modifiers={[frame({ width: 5, height: 5 }), foregroundStyle(plants)]} />
            <Text modifiers={[font({ size: labelSize, weight: "medium" }), foregroundStyle(muted), lineLimit(1)]}>
              Plants
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: pctSize, weight: "bold" }), foregroundStyle(plants), lineLimit(1)]}>
              {plantsPct}%
            </Text>
          </HStack>
          <ProgressView
            value={props.plants}
            modifiers={[progressViewStyle("linear"), tint(plants), frame({ height: barHeight })]}
          />
        </VStack>

        <VStack spacing={2}>
          <HStack spacing={4} alignment="center">
            <Circle modifiers={[frame({ width: 5, height: 5 }), foregroundStyle(carbs)]} />
            <Text modifiers={[font({ size: labelSize, weight: "medium" }), foregroundStyle(muted), lineLimit(1)]}>
              Carbs
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: pctSize, weight: "bold" }), foregroundStyle(carbs), lineLimit(1)]}>
              {carbsPct}%
            </Text>
          </HStack>
          <ProgressView
            value={props.carbs}
            modifiers={[progressViewStyle("linear"), tint(carbs), frame({ height: barHeight })]}
          />
        </VStack>
      </VStack>
    </HStack>
  );
};

export default createWidget("DigitalPlateWidget", DigitalPlateWidget);
