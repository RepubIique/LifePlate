import { palette, semantic } from "@/src/theme/palette";

export default {
  light: {
    text: semantic.text,
    background: semantic.background,
    tint: semantic.primary,
    tabIconDefault: semantic.textMuted,
    tabIconSelected: semantic.primary,
  },
  dark: {
    text: palette.white,
    background: palette.charcoal,
    tint: palette.white,
    tabIconDefault: palette.slateBlue,
    tabIconSelected: palette.white,
  },
};
