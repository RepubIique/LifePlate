import { StyleSheet, View } from "react-native";
import { PremiumCard } from "@/components/PremiumCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/src/theme/lifeplate";

export function EditMealSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrap}>
        <Skeleton width="100%" height={220} borderRadius={16} />
      </View>

      <View style={styles.cardWrap}>
        <PremiumCard noBlur style={styles.card}>
          <Skeleton width="40%" height={18} />
          <View style={styles.chips}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} width={72} height={32} borderRadius={999} />
            ))}
          </View>
        </PremiumCard>

        <PremiumCard noBlur style={styles.card}>
          <Skeleton width="35%" height={18} style={styles.gap} />
          <View style={styles.macroGrid}>
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} width="48%" height={56} borderRadius={12} />
            ))}
          </View>
        </PremiumCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingBottom: spacing.xl },
  imageWrap: { paddingHorizontal: spacing.lg },
  cardWrap: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  gap: { marginTop: spacing.sm },
});
