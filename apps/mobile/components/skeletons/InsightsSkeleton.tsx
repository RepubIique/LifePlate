import { StyleSheet, View } from "react-native";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/src/theme/lifeplate";

export function InsightsSkeleton() {
  return (
    <>
      <View style={styles.periodRow}>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} width={72} height={36} borderRadius={10} />
        ))}
      </View>

      <PremiumCard noBlur style={styles.card}>
        <Skeleton width="50%" height={20} />
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonCol}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={64} height={14} style={styles.gap} />
            <Skeleton width={40} height={22} />
          </View>
          <Skeleton width={1} height={72} borderRadius={1} />
          <View style={styles.comparisonCol}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={72} height={14} style={styles.gap} />
            <Skeleton width={40} height={22} />
          </View>
        </View>
        <Skeleton width="100%" height={8} borderRadius={999} style={styles.gap} />
        <Skeleton width="80%" height={14} />
      </PremiumCard>

      <PremiumCard noBlur style={styles.card}>
        <Skeleton width="42%" height={20} />
        <Skeleton width="100%" height={14} style={styles.gap} />
        <Skeleton width="92%" height={14} style={styles.gap} />
        <Skeleton width="78%" height={14} />
      </PremiumCard>
    </>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
  },
  comparisonCol: {
    alignItems: "center",
    flex: 1,
  },
  gap: { marginTop: spacing.sm },
});
