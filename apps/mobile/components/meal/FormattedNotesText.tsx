import {
  StyleSheet,
  Text as RNText,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { parseInlineNotes } from "@/lib/mealNotesFormat";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  value: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

function createStyles({ semantic }: AppColors) {
  return StyleSheet.create({
    base: {
      fontSize: 12,
      lineHeight: 18,
      color: semantic.text,
    },
    bold: {
      fontWeight: "700",
      fontStyle: "normal",
    },
    italic: {
      fontStyle: "italic",
      fontWeight: "400",
    },
    mention: {
      color: semantic.primary,
      fontWeight: "600",
      fontStyle: "normal",
    },
  });
}

export function FormattedNotesText({ value, style, numberOfLines }: Props) {
  const styles = useThemedStyles(createStyles);
  const trimmed = value.trim();
  if (!trimmed) return null;

  const baseStyle = StyleSheet.flatten([styles.base, style]);

  return (
    <RNText style={baseStyle} numberOfLines={numberOfLines}>
      {parseInlineNotes(trimmed).map((segment, index) => {
        if (segment.kind === "bold") {
          return (
            <RNText key={index} style={[baseStyle, styles.bold]}>
              {segment.text}
            </RNText>
          );
        }
        if (segment.kind === "italic") {
          return (
            <RNText key={index} style={[baseStyle, styles.italic]}>
              {segment.text}
            </RNText>
          );
        }
        if (segment.kind === "mention") {
          return (
            <RNText key={index} style={[baseStyle, styles.mention]}>
              @{segment.name}
            </RNText>
          );
        }
        return segment.text;
      })}
    </RNText>
  );
}
