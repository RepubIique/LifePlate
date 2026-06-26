import { StyleSheet } from "react-native";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

/** Shared bottom-sheet modal chrome (backdrop + surface). */
export function createModalStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    keyboardRoot: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: ui.scrim,
      justifyContent: "flex-end",
    },
    centerBackdrop: {
      flex: 1,
      backgroundColor: ui.scrim,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    sheet: {
      backgroundColor: semantic.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      maxHeight: "92%",
    },
    dialog: {
      backgroundColor: semantic.surface,
      borderRadius: 20,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: semantic.border,
    },
  });
}
