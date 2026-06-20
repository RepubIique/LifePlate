import { StyleSheet, View } from "react-native";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/src/theme/lifeplate";

export function FriendsSkeleton() {
  return (
    <View style={styles.wrap}>
      <PremiumCard style={styles.card} noBlur>
        <Skeleton width="40%" height={18} />
        <Skeleton width="85%" height={14} />
        <View style={styles.statsRow}>
          <Skeleton width="30%" height={64} borderRadius={12} />
          <Skeleton width="30%" height={64} borderRadius={12} />
          <Skeleton width="30%" height={64} borderRadius={12} />
        </View>
      </PremiumCard>

      <PremiumCard style={styles.card} noBlur>
        <Skeleton width="50%" height={18} />
        <Skeleton width="100%" height={52} borderRadius={14} />
        <Skeleton width="100%" height={1} />
        <Skeleton width="35%" height={18} />
        <Skeleton width="100%" height={48} borderRadius={12} />
        <Skeleton width="100%" height={44} borderRadius={12} />
      </PremiumCard>

      <Skeleton width="30%" height={14} />
      <PremiumCard style={styles.card} noBlur>
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="100%" height={56} borderRadius={12} />
      </PremiumCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: { gap: spacing.sm },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
});
