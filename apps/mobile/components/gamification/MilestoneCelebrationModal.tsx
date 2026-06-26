import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
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
      backgroundColor: ui.selectedBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { color: semantic.primary, letterSpacing: 0.2 },
    message: {
      textAlign: "center",
      color: semantic.primary,
      lineHeight: 24,
      opacity: 0.85,
    },
    button: { marginTop: spacing.sm, alignSelf: "stretch" },
  });
}

export function MilestoneCelebrationModal({ visible, message, onDismiss }: Props) {
  const modalStyles = useThemedStyles(createModalStyles);
  const styles = useThemedStyles(createStyles);
  const { semantic } = useAppColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={modalStyles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <PremiumCard style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="star-circle-outline" size={36} color={semantic.primary} />
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
