import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useAppColors } from "@/context/ThemeContext";

type Props = {
  progress: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ progress, color, height = 6 }: Props) {
  const { semantic, ui } = useAppColors();
  const fillColor = color ?? semantic.primary;
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          borderRadius: 999,
          backgroundColor: ui.trackBackground,
          overflow: "hidden",
        },
        fill: {
          height: "100%",
          borderRadius: 999,
        },
      }),
    [ui.trackBackground],
  );

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
    </View>
  );
}
