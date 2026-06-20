import { MD3LightTheme, configureFonts } from "react-native-paper";
import { palette, semantic, tints } from "./palette";

const fontConfig = configureFonts({
  config: {
    fontFamily: "System",
  },
});

export const lifeplateTheme = {
  ...MD3LightTheme,
  roundness: 16,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: semantic.primary,
    onPrimary: semantic.textOnPrimary,
    primaryContainer: semantic.primaryContainer,
    onPrimaryContainer: semantic.primary,
    secondary: semantic.secondary,
    onSecondary: semantic.textOnPrimary,
    secondaryContainer: tints.sageLight,
    onSecondaryContainer: semantic.primary,
    tertiary: semantic.tertiary,
    onTertiary: semantic.textOnDark,
    tertiaryContainer: tints.tealLight,
    onTertiaryContainer: semantic.primary,
    background: semantic.background,
    surface: semantic.surface,
    surfaceVariant: semantic.surfaceWarm,
    onSurface: semantic.text,
    onSurfaceVariant: semantic.textMuted,
    outline: semantic.border,
    outlineVariant: tints.sageLight,
    error: semantic.danger,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: semantic.surface,
    },
  },
};

export { palette, semantic, tints, ui } from "./palette";

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
};
