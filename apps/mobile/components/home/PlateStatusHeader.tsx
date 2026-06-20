import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { ScoreStatus } from "@lifeplate/shared";
import {
  scoreStatusAsPillarStatus,
  scoreStatusHeadline,
  scoreStatusSubline,
} from "@/lib/dayStatusLabels";
import { pillarColor, statusBackground } from "@/components/ui/pillarColors";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  status: ScoreStatus;
  afterDinner?: boolean;
};

export function PlateStatusHeader({ status, afterDinner = false }: Props) {
  const pillarStatus = scoreStatusAsPillarStatus(status);
  const color = pillarColor(pillarStatus);

  return (
    <View style={[styles.wrap, { backgroundColor: statusBackground(pillarStatus) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.copy}>
        <Text variant="titleSmall" style={[styles.headline, { color }]}>
          {scoreStatusHeadline(status)}
        </Text>
        <Text variant="bodySmall" style={styles.headerSubline} numberOfLines={2}>
          {scoreStatusSubline(status, afterDinner)}
        </Text>
      </View>
    </View>
  );
}

export function PlateEmptyHeader() {
  return (
    <View style={styles.wrapEmpty}>
      <Text variant="titleSmall" style={styles.emptyHeadline}>
        Not logged yet
      </Text>
      <Text variant="bodySmall" style={styles.emptySubline}>
        Log a meal and your plate will fill in below
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
  },
  wrapEmpty: {
    width: "100%",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  emptyHeadline: {
    fontWeight: "700",
    color: "#1B4332",
    letterSpacing: 0.1,
  },
  headerSubline: {
    opacity: 0.62,
    lineHeight: 18,
  },
  emptySubline: {
    opacity: 0.62,
    lineHeight: 18,
    textAlign: "center",
  },
});
