import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PillarProgress } from "@lifeplate/shared";
import { PillarInsightContent } from "@/components/nutrition/PillarInsightContent";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  pillar: PillarProgress | null;
  hydrationHint?: string;
  onClose: () => void;
};

export function PillarInsightModal({ visible, pillar, hydrationHint, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (!pillar) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text variant="titleMedium" style={styles.sheetTitle}>
              {pillar.label}
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onClose}
              accessibilityLabel="Close"
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <PillarInsightContent pillar={pillar} hydrationHint={hydrationHint} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 52, 54, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: "78%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8E4",
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: -spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    letterSpacing: 0.15,
  },
});
