import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { spacing } from "@/src/theme/lifeplate";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  loading?: boolean;
  keyboardVerticalOffset?: number;
};

type KeyboardAvoidingScrollViewProps = ScrollViewProps & {
  keyboardVerticalOffset?: number;
};

export function KeyboardAvoidingScrollView({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  ...rest
}: KeyboardAvoidingScrollViewProps) {
  const scrollView = (
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

  if (Platform.OS !== "ios") {
    return scrollView;
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollView}
    </KeyboardAvoidingView>
  );
}

export function Screen({
  scroll,
  padded = true,
  loading = false,
  style,
  children,
  keyboardVerticalOffset = 0,
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
    : { paddingTop: insets.top };

  const shell = (body: ReactNode) => (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {body}
      <LoadingOverlay visible={loading} />
    </View>
  );

  if (scroll) {
    const scrollBody = (
      <KeyboardAvoidingScrollView
        style={styles.fill}
        contentContainerStyle={[paddingStyle, style]}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {children}
      </KeyboardAvoidingScrollView>
    );

    if (Platform.OS !== "ios") {
      return shell(scrollBody);
    }

    return shell(
      <KeyboardAvoidingView
        style={styles.fill}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {scrollBody}
      </KeyboardAvoidingView>,
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
