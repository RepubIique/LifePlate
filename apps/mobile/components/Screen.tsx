import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/src/theme/lifeplate";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  keyboardVerticalOffset?: number;
  refreshControl?: ReactElement<RefreshControlProps>;
};

type KeyboardAvoidingScrollViewProps = ScrollViewProps & {
  keyboardVerticalOffset?: number;
};

export function KeyboardAvoidingScrollView({
  children,
  style,
  contentContainerStyle,
  ...rest
}: KeyboardAvoidingScrollViewProps) {
  return (
    <ScrollView
      style={[styles.fill, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      keyboardDismissMode="on-drag"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function Screen({
  scroll,
  padded = true,
  style,
  children,
  keyboardVerticalOffset = 0,
  refreshControl,
  ...rest
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const paddingStyle = padded
    ? {
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: spacing.lg,
      }
    : scroll
      ? {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.lg,
        }
      : { paddingTop: insets.top };

  const shell = (body: ReactNode) => (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {body}
    </View>
  );

  if (scroll) {
    return shell(
      <KeyboardAvoidingScrollView
        style={styles.fill}
        contentContainerStyle={[paddingStyle, style]}
        refreshControl={refreshControl}
      >
        {children}
      </KeyboardAvoidingScrollView>,
    );
  }

  const content = (
    <View
      style={[styles.fill, paddingStyle, style]}
      {...rest}
    >
      {children}
    </View>
  );

  if (Platform.OS !== "ios") {
    return shell(content);
  }

  return shell(
    <KeyboardAvoidingView
      style={styles.fill}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>,
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
