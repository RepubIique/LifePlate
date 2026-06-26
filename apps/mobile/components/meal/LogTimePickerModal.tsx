import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { clampLoggedAtToNow, setLoggedAtTime } from "@lifeplate/shared";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  loggedAt: string;
  onChange: (loggedAt: string) => void;
  onClose: () => void;
};

export function LogTimePickerModal({ visible, loggedAt, onChange, onClose }: Props) {
  const modalStyles = useThemedStyles(createModalStyles);
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      title: {
        letterSpacing: 0.15,
      },
      pickerWrap: {
        alignItems: "center",
      },
      actions: {
        gap: spacing.xs,
      },
    }),
  );
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
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[modalStyles.sheet, { paddingBottom: spacing.xl, gap: spacing.sm }]}
          onPress={(e) => e.stopPropagation()}
        >
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
