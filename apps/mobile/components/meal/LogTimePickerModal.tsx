import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { clampLoggedAtToNow, setLoggedAtTime } from "@lifeplate/shared";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  loggedAt: string;
  onChange: (loggedAt: string) => void;
  onClose: () => void;
};

export function LogTimePickerModal({ visible, loggedAt, onChange, onClose }: Props) {
  const [draft, setDraft] = useState(() => new Date(loggedAt));

  useEffect(() => {
    if (visible) {
      setDraft(new Date(loggedAt));
    }
  }, [visible, loggedAt]);

  function applyTime(next: Date) {
    const iso = clampLoggedAtToNow(
      setLoggedAtTime(loggedAt, next.getHours(), next.getMinutes()),
    );
    onChange(iso);
    onClose();
  }

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        onClose();
        return;
      }
      if (selected) applyTime(selected);
      return;
    }
    if (selected) setDraft(selected);
  }

  if (Platform.OS === "android") {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={draft}
        mode="time"
        is24Hour={false}
        display="default"
        onChange={handleChange}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="titleMedium" style={styles.title}>
            What time did you eat?
          </Text>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={draft}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={handleChange}
            />
          </View>
          <View style={styles.actions}>
            <Button mode="contained" onPress={() => applyTime(draft)}>
              Done
            </Button>
            <Button mode="text" onPress={onClose}>
              Cancel
            </Button>
          </View>
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
    gap: spacing.sm,
  },
  title: {
    letterSpacing: 0.15,
  },
  pickerWrap: {
    alignItems: "center",
  },
  actions: {
    gap: spacing.xs,
  },
});
