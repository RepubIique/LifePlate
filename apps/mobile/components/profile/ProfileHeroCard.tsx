import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput as RNTextInput, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PremiumCard } from "@/components/PremiumCard";
import { spacing } from "@/src/theme/lifeplate";

type EditField = "name" | "goal" | null;

type Props = {
  userId: string | null;
  hasAvatar: boolean;
  remoteAvatarUrl: string | null;
  name: string;
  goal: string;
  email: string | null;
  isPaid: boolean;
  friendCode: string;
  avatarUploading: boolean;
  avatarCacheRevision: number;
  onNameChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onAvatarPress: () => void;
  onShareFriendCode: () => void;
};

export function ProfileHeroCard({
  userId,
  hasAvatar,
  remoteAvatarUrl,
  name,
  goal,
  email,
  isPaid,
  friendCode,
  avatarUploading,
  avatarCacheRevision,
  onNameChange,
  onGoalChange,
  onAvatarPress,
  onShareFriendCode,
}: Props) {
  const [editing, setEditing] = useState<EditField>(null);
  const nameInputRef = useRef<RNTextInput>(null);
  const goalInputRef = useRef<RNTextInput>(null);

  const displayName = name.trim() || "Your name";
  const displayGoal = goal.trim();

  function startEditing(field: EditField) {
    setEditing(field);
    requestAnimationFrame(() => {
      if (field === "name") nameInputRef.current?.focus();
      if (field === "goal") goalInputRef.current?.focus();
    });
  }

  function finishEditing() {
    setEditing(null);
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.inner}>
        <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="profileHeroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F4FAF7" />
              <Stop offset="0.45" stopColor="#E6F4EC" />
              <Stop offset="1" stopColor="#F0F7F4" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#profileHeroGrad)" />
        </Svg>

        <View style={styles.content}>
          <ProfileAvatar
            userId={userId}
            hasAvatar={hasAvatar}
            remoteAvatarUrl={remoteAvatarUrl}
            name={displayName}
            uploading={avatarUploading}
            cacheRevision={avatarCacheRevision}
            onPress={onAvatarPress}
          />

          <View style={styles.copy}>
            {editing === "name" ? (
              <RNTextInput
                ref={nameInputRef}
                value={name}
                onChangeText={onNameChange}
                onBlur={finishEditing}
                onSubmitEditing={finishEditing}
                returnKeyType="done"
                placeholder="Your name"
                placeholderTextColor="#95A5A6"
                style={[styles.nameInput, styles.heroName]}
                accessibilityLabel="Edit name"
              />
            ) : (
              <Pressable
                onPress={() => startEditing("name")}
                style={({ pressed }) => [styles.namePressable, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Edit name"
              >
                <Text variant="headlineSmall" style={styles.heroName}>
                  {displayName}
                </Text>
                <MaterialCommunityIcons name="pencil-outline" size={14} color="#40916C" />
              </Pressable>
            )}

            <Text variant="bodyMedium" style={styles.heroEmail}>
              {email ?? "Your account"}
            </Text>

            <View style={styles.chipRow}>
              {editing === "goal" ? (
                <View style={styles.goalChipEditing}>
                  <RNTextInput
                    ref={goalInputRef}
                    value={goal}
                    onChangeText={onGoalChange}
                    onBlur={finishEditing}
                    onSubmitEditing={finishEditing}
                    returnKeyType="done"
                    placeholder="e.g. Increase protein"
                    placeholderTextColor="#7CB892"
                    style={styles.goalInput}
                    accessibilityLabel="Edit goal"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => startEditing("goal")}
                  style={({ pressed }) => [
                    displayGoal ? styles.goalChip : styles.goalChipEmpty,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={displayGoal ? "Edit goal" : "Add a goal"}
                >
                  <Text
                    variant="labelMedium"
                    style={displayGoal ? styles.goalChipText : styles.goalChipEmptyText}
                  >
                    {displayGoal || "Add a goal"}
                  </Text>
                  <MaterialCommunityIcons
                    name={displayGoal ? "pencil-outline" : "plus"}
                    size={14}
                    color={displayGoal ? "#40916C" : "#7CB892"}
                  />
                </Pressable>
              )}

              {isPaid ? (
                <View style={styles.plusChip}>
                  <Text variant="labelMedium" style={styles.plusChipText}>
                    Plus
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            style={styles.friendCodePill}
            onPress={onShareFriendCode}
            disabled={!friendCode}
            accessibilityRole="button"
            accessibilityLabel="Share friend code"
          >
            <View style={styles.friendCodeCopy}>
              <Text variant="labelSmall" style={styles.friendCodeLabel}>
                Friend code
              </Text>
              <Text variant="titleMedium" style={styles.friendCode}>
                {friendCode || "------"}
              </Text>
            </View>
            <View style={styles.shareButton}>
              <IconButton
                icon="share-variant"
                size={18}
                iconColor="#40916C"
                disabled={!friendCode}
                onPress={onShareFriendCode}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  inner: {
    position: "relative",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs,
    width: "100%",
  },
  namePressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.75,
  },
  heroName: {
    letterSpacing: 0.15,
    color: "#1B4332",
    textAlign: "center",
    fontWeight: "600",
  },
  nameInput: {
    minWidth: 160,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B7E4C7",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  heroEmail: {
    opacity: 0.6,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "#B7E4C7",
  },
  goalChipEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderWidth: 1,
    borderColor: "#B7E4C7",
    borderStyle: "dashed",
  },
  goalChipEditing: {
    minWidth: 180,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#40916C",
  },
  goalInput: {
    color: "#1B4332",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
    padding: 0,
  },
  goalChipText: {
    color: "#1B4332",
    fontWeight: "600",
  },
  goalChipEmptyText: {
    color: "#40916C",
    fontWeight: "600",
  },
  plusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1B4332",
  },
  plusChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  friendCodePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  friendCodeCopy: {
    flex: 1,
    gap: 2,
  },
  friendCodeLabel: {
    opacity: 0.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  friendCode: {
    letterSpacing: 3,
    color: "#1B4332",
    fontWeight: "700",
  },
  shareButton: {
    marginRight: -4,
  },
});
