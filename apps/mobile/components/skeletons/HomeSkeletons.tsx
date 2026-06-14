import { StyleSheet, View } from "react-native";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/src/theme/lifeplate";

export function HomeDashboardSkeleton() {
  return (
    <>
      <PremiumCard noBlur style={styles.card}>
        <View style={styles.header}>
          <Skeleton width="55%" height={20} />
          <Skeleton width={72} height={16} borderRadius={999} />
        </View>
        <View style={styles.plateWrap}>
          <Skeleton width={196} height={196} borderRadius={999} />
        </View>
        <Skeleton width="90%" height={14} style={styles.gap} />
        <Skeleton width="70%" height={14} />
      </PremiumCard>

      <PremiumCard noBlur style={styles.card}>
        <View style={styles.hydrationHeader}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.hydrationText}>
            <Skeleton width={100} height={18} />
            <Skeleton width={88} height={14} style={styles.gap} />
          </View>
          <Skeleton width={72} height={36} borderRadius={999} />
        </View>
      </PremiumCard>
    </>
  );
}

export function HomeMealsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <PremiumCard key={index} noBlur style={styles.mealRow}>
          <Skeleton width={56} height={56} borderRadius={8} />
          <View style={styles.mealText}>
            <Skeleton width="72%" height={18} />
            <Skeleton width="38%" height={14} style={styles.gap} />
          </View>
        </PremiumCard>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plateWrap: { alignItems: "center", paddingVertical: spacing.xs },
  gap: { marginTop: spacing.xs },
  hydrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  hydrationText: { flex: 1 },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  mealText: { flex: 1 },
});
