import { Image, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { MealImagePlaceholder } from "@/components/MealImage";
import { PremiumCard } from "@/components/PremiumCard";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  mealType?: string | null;
  imageUri?: string;
  attaching?: boolean;
  onPickCamera: () => void;
  onPickLibrary: () => void;
};

export function MealPhotoAttachSection({
  mealType,
  imageUri,
  attaching = false,
  onPickCamera,
  onPickLibrary,
}: Props) {
  return (
    <View style={styles.wrap}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <MealImagePlaceholder mealType={mealType} style={styles.image} iconSize={56} />
      )}

      {!imageUri ? (
        <PremiumCard>
          <Text variant="titleMedium" style={styles.title}>
            Add a photo (optional)
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Keep your text-based nutrition — attach a picture for your timeline.
          </Text>
          <View style={styles.actions}>
            <Button
              mode="contained-tonal"
              icon="camera"
              onPress={onPickCamera}
              disabled={attaching}
              style={styles.actionBtn}
            >
              Take photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={onPickLibrary}
              disabled={attaching}
              style={styles.actionBtn}
            >
              Choose photo
            </Button>
          </View>
          {attaching ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" />
              <Text variant="bodySmall" style={styles.loadingText}>
                Attaching photo…
              </Text>
            </View>
          ) : null}
        </PremiumCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
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
