import { useMemo } from "react";
import { useAppColors, useColorScheme } from "@/context/ThemeContext";
import type { AppColors, ColorScheme } from "@/src/theme/lifeplate";

/** Build StyleSheets from theme tokens; recomputes when appearance changes. */
export function useThemedStyles<T>(
  factory: (colors: AppColors, scheme: ColorScheme) => T,
): T {
  const colors = useAppColors();
  const scheme = useColorScheme();
  return useMemo(() => factory(colors, scheme), [colors, scheme]);
}
