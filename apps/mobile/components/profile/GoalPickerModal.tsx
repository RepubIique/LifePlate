import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { GOALS, type UserGoal } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { semantic, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (goal: UserGoal) => void;
  onClose: () => void;
};

export function GoalPickerModal({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="titleMedium" style={styles.title}>
            What is your goal?
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {GOALS.map((goal) => {
              const isSelected = goal === selected;
              return (
                <Pressable
                  key={goal}
                  onPress={() => {
                    onSelect(goal);
                    onClose();
                  }}
                >
                  <PremiumCard
                    noBlur
                    style={[styles.option, isSelected && styles.optionSelected]}
                  >
                    <Text
                      variant="bodyLarge"
                      style={isSelected ? styles.optionTextSelected : undefined}
                    >
                      {goal}
                    </Text>
                  </PremiumCard>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button mode="text" onPress={onClose}>
            Cancel
          </Button>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "75%",
    gap: spacing.sm,
  },
  title: {
    letterSpacing: 0.15,
  },
  list: {
    maxHeight: 420,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    borderColor: semantic.primary,
    backgroundColor: ui.cardBackground,
  },
  optionTextSelected: {
    color: semantic.primary,
  },
});
