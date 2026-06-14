import { StyleSheet, View } from "react-native";

type Props = {
  progress: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ progress, color = "#40916C", height = 6 }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    backgroundColor: "#EEF2F0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
