import { ScrollView, StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/src/theme/lifeplate";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ scroll, padded = true, style, children, ...rest }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const paddingStyle = padded
    ? {
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: spacing.lg,
      }
    : { paddingTop: insets.top };

  const content = (
    <View
      style={[styles.fill, { backgroundColor: theme.colors.background }, paddingStyle, style]}
      {...rest}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[paddingStyle, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
