import { StyleSheet, View } from "react-native";
import { MealTimelineRail, railPositionForIndex } from "@/components/home/MealTimelineRail";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

const THUMB = 88;

function TimelineMealRowSkeleton({ index, total }: { index: number; total: number }) {
  return (
    <View style={styles.mealRow}>
      <MealTimelineRail
        position={railPositionForIndex(index, total)}
        variant="filled"
        showReorder
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
      />
      <PremiumCard noBlur style={styles.mealCard}>
        <Skeleton width={THUMB} height={THUMB} borderRadius={14} />
        <View style={styles.mealBody}>
          <View style={styles.metaRow}>
            <Skeleton width={72} height={22} borderRadius={999} />
            <Skeleton width={40} height={14} />
          </View>
          <Skeleton width="85%" height={18} style={styles.gap} />
          <Skeleton width="55%" height={18} />
          <View style={styles.chips}>
            <Skeleton width={64} height={22} borderRadius={999} />
            <Skeleton width={88} height={22} borderRadius={999} />
          </View>
        </View>
      </PremiumCard>
    </View>
  );
}

export function TimelineSkeleton() {
  return (
    <View>
      <PremiumCard noBlur style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          {[0, 1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.summaryChip}>
              <Skeleton width={14} height={14} borderRadius={7} />
              <Skeleton width={24} height={16} style={styles.gap} />
              <Skeleton width={32} height={12} />
            </View>
          ))}
        </View>
      </PremiumCard>

      <View style={styles.dayGroup}>
        <View style={styles.dayHeader}>
          <Skeleton width={120} height={22} />
          <Skeleton width={56} height={22} borderRadius={999} />
        </View>
        <PremiumCard noBlur style={styles.hydrationCard}>
          <Skeleton width={140} height={16} />
          <Skeleton width="100%" height={8} borderRadius={999} style={styles.gap} />
        </PremiumCard>
        <TimelineMealRowSkeleton index={0} total={2} />
        <TimelineMealRowSkeleton index={1} total={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: ui.cardBackground,
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryChip: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dayGroup: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  hydrationCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mealCard: {
    flex: 1,
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  mealBody: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chips: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  gap: { marginTop: spacing.xs },
});
