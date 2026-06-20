import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { Text, type TextProps } from "react-native-paper";
import { parseInlineNotes } from "@/lib/mealNotesFormat";

type Props = Pick<TextProps<typeof Text>, "numberOfLines" | "variant"> & {
  value: string;
  style?: StyleProp<TextStyle>;
};

export function FormattedNotesText({ value, style, variant = "bodySmall", numberOfLines }: Props) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  return (
    <Text variant={variant} style={style} numberOfLines={numberOfLines}>
      {parseInlineNotes(trimmed).map((segment, index) => {
        if (segment.kind === "bold") {
          return (
            <Text key={index} style={styles.bold}>
              {segment.text}
            </Text>
          );
        }
        if (segment.kind === "italic") {
          return (
            <Text key={index} style={styles.italic}>
              {segment.text}
            </Text>
          );
        }
        return segment.text;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
});
