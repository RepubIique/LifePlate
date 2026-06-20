import { useSegments } from "expo-router";
import type { ComponentProps } from "react";
import { Portal, Snackbar } from "react-native-paper";
import { spacing } from "@/src/theme/lifeplate";

const TAB_BAR_HEIGHT = 56;

type Props = ComponentProps<typeof Snackbar>;

export function BottomSnackbar({ wrapperStyle, ...rest }: Props) {
  const segments = useSegments();
  const onTabs = segments[0] === "(tabs)";
  const bottom = (onTabs ? TAB_BAR_HEIGHT : 0) + spacing.sm;

  return (
    <Portal>
      <Snackbar
        {...rest}
        wrapperStyle={[{ bottom }, wrapperStyle]}
      />
    </Portal>
  );
}
