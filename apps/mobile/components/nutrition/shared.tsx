import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillarStatus } from "@lifeplate/shared";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

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

export function FoodChips({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return emptyLabel ? (
      <Text variant="bodyMedium" style={styles.empty}>
        {emptyLabel}
      </Text>
    ) : null;
  }

  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text variant="labelMedium" style={styles.chipText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.detailBlock}>
      <Text variant="labelLarge" style={styles.detailLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bulletList: { gap: 4 },
  bulletItem: { opacity: 0.85, lineHeight: 20 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: ui.trackBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    color: semantic.primary,
    letterSpacing: 0.1,
  },
  empty: { opacity: 0.55, fontStyle: "italic" },
  detailBlock: { gap: spacing.xs },
  detailLabel: {
    opacity: 0.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
