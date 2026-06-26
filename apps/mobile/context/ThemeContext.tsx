import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, type MD3Theme } from "react-native-paper";
import {
  getAppColors,
  getLifeplateTheme,
  type AppColors,
  type ColorScheme,
} from "@/src/theme/lifeplate";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/themePrefs";

type ThemeContextValue = {
  preference: ThemePreference;
  colorScheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
  colors: AppColors;
  paperTheme: MD3Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ReturnType<typeof useSystemColorScheme>,
): ColorScheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void getThemePreference().then((stored) => {
      if (stored) {
        setPreferenceState(stored);
      }
    });
  }, []);

  const colorScheme = resolveColorScheme(preference, systemScheme);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void setThemePreference(next);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      colorScheme,
      setPreference,
      colors: getAppColors(colorScheme),
      paperTheme: getLifeplateTheme(colorScheme),
    }),
    [colorScheme, preference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={value.paperTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}

export function useAppColors(): AppColors {
  return useThemeContext().colors;
}

export function useColorScheme(): ColorScheme {
  return useThemeContext().colorScheme;
}

export function useThemePreference() {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}
