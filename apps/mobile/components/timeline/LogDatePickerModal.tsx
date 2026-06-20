import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MAX_LOG_PAST_DAYS, formatLogDateLabel, recentLogDateKeys } from "@lifeplate/shared";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
};

export function LogDatePickerModal({ visible, selectedDateKey, onSelect, onClose }: Props) {
  const options = recentLogDateKeys(MAX_LOG_PAST_DAYS);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="titleMedium" style={styles.title}>
            Which day was this meal?
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((dateKey) => {
              const selected = dateKey === selectedDateKey;
              return (
                <Pressable
                  key={dateKey}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(dateKey);
                    onClose();
                  }}
                >
                  <Text variant="bodyLarge" style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {formatLogDateLabel(dateKey)}
                  </Text>
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
    maxHeight: "70%",
    gap: spacing.sm,
  },
  title: {
    letterSpacing: 0.15,
  },
  list: {
    maxHeight: 360,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: "#D8F3DC",
  },
  optionText: {
    letterSpacing: 0.1,
  },
  optionTextSelected: {
    color: "#1B4332",
    fontWeight: "600",
  },
});
