import { StyleSheet, View } from "react-native";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/src/theme/lifeplate";

const THUMB = 88;

function TimelineMealRowSkeleton() {
  return (
    <View style={styles.mealRow}>
      <View style={styles.rail}>
        <Skeleton width={10} height={10} borderRadius={5} />
        <Skeleton width={2} height={48} borderRadius={1} style={styles.railLine} />
      </View>
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
      <View style={styles.summaryRow}>
        {[0, 1].map((index) => (
          <PremiumCard key={index} noBlur style={styles.summaryCard}>
            <Skeleton width={20} height={20} borderRadius={10} />
            <Skeleton width={36} height={28} style={styles.gap} />
            <Skeleton width={72} height={14} />
          </PremiumCard>
        ))}
      </View>

      <View style={styles.dayGroup}>
        <View style={styles.dayHeader}>
          <Skeleton width={120} height={22} />
          <Skeleton width={56} height={22} borderRadius={999} />
        </View>
        <PremiumCard noBlur style={styles.hydrationCard}>
          <Skeleton width={140} height={16} />
          <Skeleton width="100%" height={8} borderRadius={999} style={styles.gap} />
        </PremiumCard>
        <TimelineMealRowSkeleton />
        <TimelineMealRowSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.md,
    backgroundColor: "#F8FBF9",
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
    marginBottom: spacing.sm,
  },
  rail: {
    width: 16,
    alignItems: "center",
  },
  railLine: {
    marginTop: 4,
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
