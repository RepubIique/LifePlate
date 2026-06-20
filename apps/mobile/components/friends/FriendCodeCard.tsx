import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Share, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

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
  async function handleShare() {
    await Share.share({
      message: `Join me on LifePlate! Use my friend code: ${friendCode}`,
    });
    onCopied?.();
  }

  const canAdd = addCode.trim().length > 0 && !adding;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="qrcode" size={20} color={semantic.primary} />
        </View>
        <View style={styles.sectionCopy}>
          <Text variant="titleMedium" style={styles.title}>
            Your friend code
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Share this code so friends can connect with you.
          </Text>
        </View>
      </View>

      <View style={styles.codePill}>
        <Text variant="headlineSmall" style={styles.code}>
          {friendCode}
        </Text>
        <Button
          mode="contained-tonal"
          onPress={() => void handleShare()}
          compact
          icon="share-variant-outline"
        >
          Share
        </Button>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, styles.addIconWrap]}>
          <MaterialCommunityIcons name="account-plus-outline" size={20} color={semantic.primary} />
        </View>
        <View style={styles.sectionCopy}>
          <Text variant="titleMedium" style={styles.title}>
            Add a friend
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Enter their code to connect instantly.
          </Text>
        </View>
      </View>

      <View style={styles.addRow}>
        <TextInput
          label="Friend code"
          value={addCode}
          onChangeText={onAddCodeChange}
          autoCapitalize="characters"
          autoCorrect={false}
          mode="outlined"
          style={styles.input}
          dense
          onSubmitEditing={() => {
            if (canAdd) onAddFriend();
          }}
        />
        <Button
          mode="contained"
          onPress={onAddFriend}
          loading={adding}
          disabled={!canAdd}
          style={styles.addBtn}
          contentStyle={styles.addBtnContent}
        >
          Add
        </Button>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ui.selectedBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconWrap: { backgroundColor: ui.trackBackground },
  sectionCopy: { flex: 1, gap: 2 },
  title: { color: semantic.primary, letterSpacing: 0.1 },
  subtitle: { opacity: 0.6, lineHeight: 18 },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: ui.cardBackground,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  code: {
    letterSpacing: 5,
    color: semantic.primary,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: 1,
    backgroundColor: ui.trackBackground,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  addBtn: { marginTop: 6 },
  addBtnContent: { paddingHorizontal: spacing.sm },
});
