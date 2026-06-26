import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MealListItem, PillarProgress } from "@lifeplate/shared";
import { PillarInsightContent } from "@/components/nutrition/PillarInsightContent";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  pillar: PillarProgress | null;
  hydrationHint?: string;
  todayMeals?: MealListItem[];
  onPlantSourcesChanged?: () => void;
  onClose: () => void;
};

function createLocalStyles({ ui }: AppColors) {
  return StyleSheet.create({
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: ui.borderSubtle,
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
}

export function PillarInsightModal({
  visible,
  pillar,
  hydrationHint,
  todayMeals,
  onPlantSourcesChanged,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalStyles = useThemedStyles(createModalStyles);
  const styles = useThemedStyles(createLocalStyles);

  if (!pillar) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            modalStyles.sheet,
            { paddingBottom: insets.bottom + spacing.md, paddingTop: spacing.sm, maxHeight: "78%" },
          ]}
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
            <PillarInsightContent
              pillar={pillar}
              hydrationHint={hydrationHint}
              todayMeals={todayMeals}
              onPlantSourcesChanged={onPlantSourcesChanged}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
