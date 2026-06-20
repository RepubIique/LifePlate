import { Share, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type FriendCodeCardProps = {
  friendCode: string;
  addCode: string;
  adding: boolean;
  onAddCodeChange: (value: string) => void;
  onAddFriend: () => void;
  onCopied?: () => void;
};

export function FriendCodeCard({
  friendCode,
  addCode,
  adding,
  onAddCodeChange,
  onAddFriend,
  onCopied,
}: FriendCodeCardProps) {
  async function handleCopy() {
    await Share.share({ message: friendCode });
    onCopied?.();
  }

  return (
    <PremiumCard style={styles.card}>
      <Text variant="titleMedium" style={styles.title}>
        Your friend code
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Share this code so friends can connect with you on LifePlate.
      </Text>
      <View style={styles.codeRow}>
        <Text variant="headlineSmall" style={styles.code}>
          {friendCode}
        </Text>
        <Button mode="outlined" onPress={() => void handleCopy()} compact>
          Share
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.addTitle}>
        Add a friend
      </Text>
      <TextInput
        label="Friend code"
        value={addCode}
        onChangeText={onAddCodeChange}
        autoCapitalize="characters"
        autoCorrect={false}
        mode="outlined"
        style={styles.input}
      />
      <Button mode="contained" onPress={onAddFriend} loading={adding} disabled={adding}>
        Add friend
      </Button>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { color: "#1B4332" },
  subtitle: { opacity: 0.65 },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  code: {
    letterSpacing: 4,
    color: "#1B4332",
    fontWeight: "600",
  },
  addTitle: { marginTop: spacing.sm, color: "#1B4332" },
  input: { backgroundColor: "#FFFFFF" },
});
