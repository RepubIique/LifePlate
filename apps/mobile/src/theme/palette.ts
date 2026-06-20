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

/** Derived tints for backgrounds, borders, and containers. */
export const tints = {
  sageLight: "#E8EDE0",
  creamLight: "#FAF6F0",
  orangeLight: "#FFF4E0",
  coralLight: "#FDE8E6",
  tealLight: "#E8F5F4",
} as const;

export const semantic = {
  background: palette.white,
  backgroundWarm: palette.cream,
  surface: palette.white,
  surfaceWarm: tints.creamLight,

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
  borderLight: tints.sageLight,

  primaryContainer: tints.sageLight,
  successBackground: tints.sageLight,
  warningBackground: tints.orangeLight,
  dangerBackground: tints.coralLight,
  streakBackground: tints.orangeLight,
} as const;
