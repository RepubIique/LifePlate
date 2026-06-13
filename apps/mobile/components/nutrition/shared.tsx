import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarStatus } from "@lifeplate/shared";
import { spacing } from "@/src/theme/lifeplate";

export function ProgressBlocks({ progress, blocks = 10 }: { progress: number; blocks?: number }) {
  const filled = Math.round(Math.max(0, Math.min(1, progress)) * blocks);
  const bar = "█".repeat(filled) + "░".repeat(blocks - filled);

  return (
    <Text variant="bodySmall" style={styles.blocks}>
      {bar}
    </Text>
  );
}

export function statusLabel(status: PillarStatus | "on_track" | "moderate" | "needs_improvement"): string {
  if (status === "good" || status === "on_track") return "Good";
  if (status === "moderate") return "Moderate";
  return "Needs improvement";
}

export function statusEmoji(status: PillarStatus | "on_track" | "moderate" | "needs_improvement"): string {
  if (status === "good" || status === "on_track") return "🟢";
  if (status === "moderate") return "🟡";
  return "🔴";
}

export function SectionDivider() {
  return <View style={styles.divider} />;
}

export function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <Text key={item} variant="bodyMedium" style={styles.bulletItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: {
    letterSpacing: 1,
    opacity: 0.85,
    fontFamily: "Menlo",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginVertical: spacing.sm,
  },
  bulletList: { gap: 4 },
  bulletItem: { opacity: 0.85, lineHeight: 20 },
});
