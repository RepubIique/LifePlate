import { MD3LightTheme, configureFonts } from "react-native-paper";

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
    primary: "#1B4332",
    onPrimary: "#FFFFFF",
    primaryContainer: "#D8F3DC",
    onPrimaryContainer: "#1B4332",
    secondary: "#40916C",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F8F9FA",
    onSurface: "#2D3436",
    onSurfaceVariant: "#636E72",
    outline: "#E9ECEF",
    outlineVariant: "#F1F3F5",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: "#FFFFFF",
    },
  },
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
};
