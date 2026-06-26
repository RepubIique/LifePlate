/**
 * LifePlate brand palette (Coolors).
 * Use semantic tokens in components; reach for raw palette only when needed.
 */
export const palette = {
  white: "#FFFFFF",
  cream: "#F2E9D8",
  softOrange: "#FFD07B",
  coral: "#F07167",
  terracotta: "#C46A4A",
  sage: "#A3B18A",
  teal: "#8CCBC9",
  hydrationBlue: "#D7F0FB",
  slateBlue: "#5E7D8A",
  forest: "#3E5641",
  charcoal: "#282B28",
} as const;

export type ColorScheme = "light" | "dark";

/** Derived tints for backgrounds, borders, and containers (light mode). */
export const tintsLight = {
  sageLight: "#E8EDE0",
  creamLight: "#FAF6F0",
  orangeLight: "#FFF4E0",
  coralLight: "#FDE8E6",
  tealLight: "#E8F5F4",
} as const;

/** Derived tints for backgrounds, borders, and containers (dark mode). */
export const tintsDark = {
  sageLight: "#2A3228",
  creamLight: "#2E2B26",
  orangeLight: "#3D3220",
  coralLight: "#3D2826",
  tealLight: "#243332",
} as const;

export const semanticLight = {
  background: palette.white,
  backgroundWarm: palette.cream,
  surface: palette.white,
  surfaceWarm: tintsLight.creamLight,

  text: palette.charcoal,
  textMuted: palette.slateBlue,
  textOnPrimary: palette.white,
  textOnDark: palette.white,

  primary: palette.forest,
  primaryLight: palette.sage,
  secondary: palette.sage,
  accent: palette.terracotta,
  tertiary: palette.teal,

  success: palette.sage,
  warning: palette.softOrange,
  danger: palette.coral,
  streak: palette.softOrange,

  border: palette.cream,
  borderLight: tintsLight.sageLight,

  primaryContainer: tintsLight.sageLight,
  successBackground: tintsLight.sageLight,
  warningBackground: tintsLight.orangeLight,
  dangerBackground: tintsLight.coralLight,
  streakBackground: tintsLight.orangeLight,
} as const;

export const semanticDark = {
  background: "#1A1D1A",
  backgroundWarm: "#221F1C",
  surface: "#242724",
  surfaceWarm: tintsDark.creamLight,

  text: palette.cream,
  textMuted: "#9AADB4",
  textOnPrimary: palette.white,
  textOnDark: palette.white,

  primary: palette.sage,
  primaryLight: palette.teal,
  secondary: palette.sage,
  accent: palette.terracotta,
  tertiary: palette.teal,

  success: palette.sage,
  warning: palette.softOrange,
  danger: palette.coral,
  streak: palette.softOrange,

  border: "#3A3D38",
  borderLight: tintsDark.sageLight,

  primaryContainer: tintsDark.sageLight,
  successBackground: tintsDark.sageLight,
  warningBackground: tintsDark.orangeLight,
  dangerBackground: tintsDark.coralLight,
  streakBackground: tintsDark.orangeLight,
} as const;

export const uiLight = {
  cardBackground: tintsLight.tealLight,
  selectedBackground: tintsLight.sageLight,
  pressedBackground: tintsLight.tealLight,
  trackBackground: tintsLight.sageLight,
  borderSubtle: tintsLight.sageLight,
  iconPrimary: semanticLight.primary,
  iconMuted: semanticLight.textMuted,
  iconStreak: palette.terracotta,
  disabled: palette.slateBlue,
  scrim: "rgba(45, 52, 54, 0.45)",
  skeletonBase: "#E9ECEF",
  skeletonHighlight: "#F8F9FA",
  inputBackground: "#F8F9FA",
  inputBackgroundAlt: "#F4F7F5",
  frosted: "rgba(255, 255, 255, 0.85)",
  frostedSoft: "rgba(255, 255, 255, 0.72)",
  frostedMuted: "rgba(255, 255, 255, 0.45)",
  frostedPill: "rgba(255, 255, 255, 0.82)",
  frostedChip: "rgba(255, 255, 255, 0.92)",
  dangerPressed: "#FDF2F2",
  plateCenter: palette.white,
  iconOnPrimary: palette.white,
  shadowSubtle: "rgba(0, 0, 0, 0.04)",
  avatarRing: "#E8F5E9",
  pickerSurface: "#FAFBFA",
} as const;

export const uiDark = {
  cardBackground: tintsDark.tealLight,
  selectedBackground: tintsDark.sageLight,
  pressedBackground: tintsDark.tealLight,
  trackBackground: tintsDark.sageLight,
  borderSubtle: tintsDark.sageLight,
  iconPrimary: semanticDark.primary,
  iconMuted: semanticDark.textMuted,
  iconStreak: palette.terracotta,
  disabled: "#6B7F87",
  scrim: "rgba(0, 0, 0, 0.62)",
  skeletonBase: "#2E3230",
  skeletonHighlight: "#3A3E3B",
  inputBackground: "#2A2D2A",
  inputBackgroundAlt: "#2E322E",
  frosted: "rgba(36, 39, 36, 0.92)",
  frostedSoft: "rgba(36, 39, 36, 0.78)",
  frostedMuted: "rgba(36, 39, 36, 0.55)",
  frostedPill: "rgba(36, 39, 36, 0.88)",
  frostedChip: "rgba(36, 39, 36, 0.94)",
  dangerPressed: tintsDark.coralLight,
  plateCenter: "#2E332E",
  iconOnPrimary: palette.white,
  shadowSubtle: "rgba(0, 0, 0, 0.28)",
  avatarRing: tintsDark.sageLight,
  pickerSurface: "#2A2D2A",
} as const;

/** @deprecated Prefer `useAppColors()` for theme-aware colors. */
export const semantic = semanticLight;
/** @deprecated Prefer `useAppColors()` for theme-aware colors. */
export const tints = tintsLight;
/** @deprecated Prefer `useAppColors()` for theme-aware colors. */
export const ui = uiLight;

export function getSemanticColors(scheme: ColorScheme) {
  return scheme === "dark" ? semanticDark : semanticLight;
}

export function getTints(scheme: ColorScheme) {
  return scheme === "dark" ? tintsDark : tintsLight;
}

export function getUi(scheme: ColorScheme) {
  return scheme === "dark" ? uiDark : uiLight;
}

export function getAppColors(scheme: ColorScheme) {
  return {
    palette,
    semantic: getSemanticColors(scheme),
    tints: getTints(scheme),
    ui: getUi(scheme),
  };
}

export type AppColors = ReturnType<typeof getAppColors>;
type SemanticColorKey = keyof typeof semanticLight;
type TintColorKey = keyof typeof tintsLight;
export type SemanticColors = { [K in SemanticColorKey]: string };
export type TintColors = { [K in TintColorKey]: string };
export type UiColors = typeof uiLight;
