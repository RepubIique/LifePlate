import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarStatus } from "@lifeplate/shared";
import { pillarColor, statusBackground } from "./pillarColors";

type TrendStatus = "on_track" | "moderate" | "needs_improvement";

type Props = {
  status: PillarStatus | TrendStatus;
  label?: string;
};

function defaultLabel(status: PillarStatus | TrendStatus): string {
  if (status === "good" || status === "on_track") return "On track";
  if (status === "moderate") return "Moderate";
  return "Needs work";
}

export function StatusBadge({ status, label }: Props) {
  const text = label ?? defaultLabel(status);
  const color = pillarColor(status === "on_track" ? "good" : status === "needs_improvement" ? "low" : status);

  return (
    <View style={[styles.badge, { backgroundColor: statusBackground(status) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="labelMedium" style={[styles.text, { color }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
