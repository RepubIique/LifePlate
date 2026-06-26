import { Image, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Button, IconButton, Text } from "react-native-paper";
import { MealImagePlaceholder } from "@/components/MealImage";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { createPremiumTokens } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  mealType?: string | null;
  imageUri?: string;
  attaching?: boolean;
  variant?: "default" | "compact";
  timeEditButton?: ReactNode;
  onPickCamera: () => void;
  onPickLibrary: () => void;
};

function createStyles(colors: AppColors) {
  const premium = createPremiumTokens(colors);
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    compactWrap: { paddingHorizontal: spacing.lg },
    compactImageFrame: {
      width: "100%",
      height: 168,
      borderRadius: premium.imageRadius,
      overflow: "hidden",
      backgroundColor: colors.ui.inputBackgroundAlt,
    },
    compactImage: { width: "100%", height: "100%" },
    compactLoading: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    compactActions: {
      position: "absolute",
      right: spacing.xs,
      bottom: spacing.xs,
      flexDirection: "row",
      gap: 2,
    },
    image: { width: "100%", height: 220, borderRadius: premium.imageRadius },
    title: { letterSpacing: 0.15 },
    subtitle: { opacity: 0.7, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.sm },
    actions: { gap: spacing.sm },
    actionBtn: { alignSelf: "stretch" },
    loading: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    loadingText: { opacity: 0.7 },
  });
}

export function MealPhotoAttachSection({
  mealType,
  imageUri,
  attaching = false,
  variant = "default",
  timeEditButton,
  onPickCamera,
  onPickLibrary,
}: Props) {
  const { semantic, ui } = useAppColors();
  const styles = useThemedStyles(createStyles);
  const hasPhoto = Boolean(imageUri?.trim());
  const compact = variant === "compact";

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <View style={styles.compactImageFrame}>
          {hasPhoto ? (
            <Image source={{ uri: imageUri }} style={styles.compactImage} />
          ) : (
            <MealImagePlaceholder mealType={mealType} style={styles.compactImage} iconSize={40} />
          )}
          {attaching ? (
            <View style={styles.compactLoading}>
              <ActivityIndicator size="small" color={ui.iconOnPrimary} />
            </View>
          ) : null}
          <View style={styles.compactActions}>
            {timeEditButton}
            <IconButton
              icon="camera"
              mode="contained"
              containerColor={ui.frostedChip}
              iconColor={semantic.primary}
              size={18}
              onPress={onPickCamera}
              disabled={attaching}
              accessibilityLabel={hasPhoto ? "Retake photo" : "Take photo"}
            />
            <IconButton
              icon="image"
              mode="contained"
              containerColor={ui.frostedChip}
              iconColor={semantic.primary}
              size={18}
              onPress={onPickLibrary}
              disabled={attaching}
              accessibilityLabel={hasPhoto ? "Choose new photo" : "Choose photo"}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {hasPhoto ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <MealImagePlaceholder mealType={mealType} style={styles.image} iconSize={56} />
      )}

      <PremiumCard>
        <Text variant="titleMedium" style={styles.title}>
          {hasPhoto ? "Change photo" : "Add a photo (optional)"}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {hasPhoto
            ? "Replace the picture saved with this meal."
            : "Keep your text-based nutrition — attach a picture for your timeline."}
        </Text>
        <View style={styles.actions}>
          <Button
            mode="contained-tonal"
            icon="camera"
            onPress={onPickCamera}
            disabled={attaching}
            style={styles.actionBtn}
          >
            {hasPhoto ? "Retake photo" : "Take photo"}
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={onPickLibrary}
            disabled={attaching}
            style={styles.actionBtn}
          >
            {hasPhoto ? "Choose new photo" : "Choose photo"}
          </Button>
        </View>
        {attaching ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall" style={styles.loadingText}>
              {hasPhoto ? "Updating photo…" : "Attaching photo…"}
            </Text>
          </View>
        ) : null}
      </PremiumCard>
    </View>
  );
}
