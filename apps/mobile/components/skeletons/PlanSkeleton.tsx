import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

export function PlanSkeleton() {
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      wrap: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        paddingTop: spacing.sm,
      },
      card: {
        height: 88,
        borderRadius: 16,
      },
      day: {
        height: 20,
        width: "45%",
        borderRadius: 8,
      },
    }),
  );

  return (
    <View style={styles.wrap}>
      <Skeleton height={88} style={styles.card} />
      <Skeleton height={20} width="45%" style={styles.day} />
      <Skeleton height={88} style={styles.card} />
      <Skeleton height={88} style={styles.card} />
      <Skeleton height={20} width="45%" style={styles.day} />
      <Skeleton height={88} style={styles.card} />
    </View>
  );
}
