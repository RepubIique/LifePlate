import { MD3DarkTheme, MD3LightTheme, configureFonts } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";
import {
  palette,
  semantic,
  semanticDark,
  semanticLight,
  tints,
  tintsDark,
  tintsLight,
  ui,
  type ColorScheme,
  type SemanticColors,
  type TintColors,
} from "./palette";

const fontConfig = configureFonts({
  config: {
    fontFamily: "System",
  },
});

function buildLifeplateTheme(
  base: MD3Theme,
  semanticColors: SemanticColors,
  tintColors: TintColors,
): MD3Theme {
  return {
    ...base,
    roundness: 16,
    fonts: fontConfig,
    colors: {
      ...base.colors,
      primary: semanticColors.primary,
      onPrimary: semanticColors.textOnPrimary,
      primaryContainer: semanticColors.primaryContainer,
      onPrimaryContainer: semanticColors.primary,
      secondary: semanticColors.secondary,
      onSecondary: semanticColors.textOnPrimary,
      secondaryContainer: tintColors.sageLight,
      onSecondaryContainer: semanticColors.primary,
      tertiary: semanticColors.tertiary,
      onTertiary: semanticColors.textOnDark,
      tertiaryContainer: tintColors.tealLight,
      onTertiaryContainer: semanticColors.primary,
      background: semanticColors.background,
      surface: semanticColors.surface,
      surfaceVariant: semanticColors.surfaceWarm,
      onSurface: semanticColors.text,
      onSurfaceVariant: semanticColors.textMuted,
      outline: semanticColors.border,
      outlineVariant: tintColors.sageLight,
      error: semanticColors.danger,
      elevation: {
        ...base.colors.elevation,
        level1: semanticColors.surface,
      },
    },
  };
}

export const lifeplateLightTheme = buildLifeplateTheme(
  MD3LightTheme,
  semanticLight,
  tintsLight,
);

export const lifeplateDarkTheme = buildLifeplateTheme(
  MD3DarkTheme,
  semanticDark,
  tintsDark,
);

/** @deprecated Use `getLifeplateTheme(colorScheme)` or `useThemeContext().paperTheme`. */
export const lifeplateTheme = lifeplateLightTheme;

export function getLifeplateTheme(scheme: ColorScheme): MD3Theme {
  return scheme === "dark" ? lifeplateDarkTheme : lifeplateLightTheme;
}

export { palette, semantic, tints, ui } from "./palette";
export { getAppColors, type AppColors, type ColorScheme } from "./palette";

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
};
