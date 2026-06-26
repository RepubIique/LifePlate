import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";

export type RailPosition = "first" | "middle" | "last" | "only";

export function railPositionForIndex(index: number, total: number): RailPosition {
  if (total <= 1) return "only";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

type ReorderProps = {
  showReorder?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

type Props = ReorderProps & {
  position: RailPosition;
  variant?: "default" | "filled" | "suggested";
};

function createStyles({ palette, semantic, ui }: AppColors) {
  const DOT = 10;

  return StyleSheet.create({
    rail: {
      width: 22,
      alignSelf: "stretch",
    },
    railReorder: {
      width: 32,
    },
    lineCol: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    line: {
      flex: 1,
      width: 2,
      backgroundColor: ui.borderSubtle,
      borderRadius: 1,
      minHeight: 8,
    },
    lineFilled: {
      backgroundColor: palette.sage,
    },
    lineSuggested: {
      backgroundColor: palette.teal,
    },
    lineGap: {
      flex: 1,
      minHeight: 8,
    },
    dot: {
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      backgroundColor: semantic.surface,
      borderWidth: 2,
      borderColor: ui.borderSubtle,
      marginVertical: 2,
    },
    dotFilled: {
      borderColor: semantic.primary,
      backgroundColor: ui.selectedBackground,
    },
    dotSuggested: {
      width: DOT + 4,
      height: DOT + 4,
      borderRadius: (DOT + 4) / 2,
      borderColor: semantic.primary,
      backgroundColor: semantic.primary,
      marginVertical: 0,
    },
    reorderButton: {
      width: 28,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    reorderButtonPressed: {
      backgroundColor: ui.selectedBackground,
    },
    reorderButtonDisabled: {
      opacity: 0.4,
    },
  });
}

function RailReorderButton({
  icon,
  disabled,
  onPress,
  label,
  styles,
  enabledColor,
  disabledColor,
}: {
  icon: "chevron-up" | "chevron-down";
  disabled?: boolean;
  onPress?: () => void;
  label: string;
  styles: ReturnType<typeof createStyles>;
  enabledColor: string;
  disabledColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.reorderButton,
        disabled && styles.reorderButtonDisabled,
        pressed && !disabled && styles.reorderButtonPressed,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={disabled ? disabledColor : enabledColor}
      />
    </Pressable>
  );
}

export function MealTimelineRail({
  position,
  variant = "default",
  showReorder = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: Props) {
  const { semantic, ui } = useAppColors();
  const styles = useThemedStyles(createStyles);
  const showTopLine = position === "middle" || position === "last";
  const showBottomLine = position === "first" || position === "middle";

  return (
    <View style={[styles.rail, showReorder && styles.railReorder]}>
      <View style={styles.lineCol}>
        {showReorder ? (
          <RailReorderButton
            icon="chevron-up"
            disabled={!canMoveUp}
            onPress={onMoveUp}
            label="Move meal earlier in the day"
            styles={styles}
            enabledColor={semantic.primary}
            disabledColor={ui.disabled}
          />
        ) : null}

        {showTopLine ? (
          <View
            style={[
              styles.line,
              variant === "suggested" && styles.lineSuggested,
              variant === "filled" && styles.lineFilled,
            ]}
          />
        ) : (
          <View style={styles.lineGap} />
        )}

        <View
          style={[
            styles.dot,
            variant === "filled" && styles.dotFilled,
            variant === "suggested" && styles.dotSuggested,
          ]}
        />

        {showBottomLine ? (
          <View
            style={[
              styles.line,
              variant === "filled" && styles.lineFilled,
            ]}
          />
        ) : (
          <View style={styles.lineGap} />
        )}

        {showReorder ? (
          <RailReorderButton
            icon="chevron-down"
            disabled={!canMoveDown}
            onPress={onMoveDown}
            label="Move meal later in the day"
            styles={styles}
            enabledColor={semantic.primary}
            disabledColor={ui.disabled}
          />
        ) : null}
      </View>
    </View>
  );
}
