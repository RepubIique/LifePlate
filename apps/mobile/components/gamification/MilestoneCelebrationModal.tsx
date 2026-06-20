import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
};

export function MilestoneCelebrationModal({ visible, message, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <PremiumCard style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="star-circle-outline" size={36} color="#40916C" />
            </View>
            <Text variant="titleMedium" style={styles.title}>
              Milestone
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
              {message}
            </Text>
            <Button mode="contained" onPress={onDismiss} style={styles.button}>
              Nice
            </Button>
          </PremiumCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  sheet: { width: "100%" },
  card: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D8F3DC",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#1B4332", letterSpacing: 0.2 },
  message: {
    textAlign: "center",
    color: "#1B4332",
    lineHeight: 24,
    opacity: 0.85,
  },
  button: { marginTop: spacing.sm, alignSelf: "stretch" },
});
