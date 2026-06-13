import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton, Snackbar, Text } from "react-native-paper";
import type { MealListItem } from "@lifeplate/shared";
import type { ImagePickerAsset } from "expo-image-picker";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { fetchMeals, uploadMealImage } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { prepareMealImage } from "@/lib/imagePrep";
import { premium } from "@/src/theme/premium";
import { premiumStyles } from "@/src/theme/premium";
import { getLastPhotoSource, setLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { spacing } from "@/src/theme/lifeplate";

type UploadStage = "idle" | "preparing" | "analyzing";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function stageLabel(stage: UploadStage) {
  if (stage === "preparing") return "Preparing photo…";
  if (stage === "analyzing") return "Analyzing your meal…";
  return "";
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const [meals, setMeals] = useState<MealListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const lastAssetRef = useRef<ImagePickerAsset | null>(null);
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMeals();
      setMeals(data);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      getLastPhotoSource().then(setPreferredSource);
    }, [load]),
  );

  async function processAsset(asset: ImagePickerAsset) {
    setError(null);
    setUploadStage("preparing");
    try {
      const prepared = await prepareMealImage(asset.uri);
      setUploadStage("analyzing");
      const analysis = await uploadMealImage(prepared);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/meal/result",
        params: {
          draftId: analysis.draftId,
          imageUrl: analysis.imageUrl,
          mealName: analysis.mealName,
          foods: JSON.stringify(analysis.foods),
          estimatedCalories: String(analysis.estimatedCalories),
          protein: String(analysis.protein),
          carbs: String(analysis.carbs),
          fat: String(analysis.fat),
          fibre: String(analysis.fibre),
          sugar: String(analysis.sugar),
          sodium: String(analysis.sodium),
          confidence: String(analysis.confidence),
          coachNudge: analysis.coachNudge,
        },
      });
    } catch (e) {
      setError(friendlyErrorMessage(e));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadStage("idle");
    }
  }

  async function pickAndAnalyze(useCamera: boolean) {
    const source: PhotoSource = useCamera ? "camera" : "library";
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permission required to access photos or camera.");
      return;
    }

    await setLastPhotoSource(source);
    setPreferredSource(source);

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    lastAssetRef.current = asset;
    await processAsset(asset);
  }

  const uploading = uploadStage !== "idle";
  const todayMeals = meals.filter((m) => isToday(m.createdAt));

  return (
    <Screen padded={false}>
      <PremiumHeader
        title="LifePlate"
        subtitle={`${profile?.currentStreak ?? 0} day streak`}
        right={
          <IconButton
            icon="account-circle-outline"
            onPress={() => router.push("/(tabs)/profile")}
          />
        }
      />

      <View style={styles.hero}>
        <PremiumCard>
          <Text variant="titleLarge" style={styles.ctaText}>
            What are you eating?
          </Text>
          <Text variant="bodyMedium" style={styles.ctaSub}>
            {preferredSource === "camera"
              ? "Last used: camera"
              : preferredSource === "library"
                ? "Last used: photo library"
                : "Log a meal in seconds. You can edit before saving."}
          </Text>

          <View style={styles.heroActions}>
            <Button
              mode="contained"
              icon="camera"
              onPress={() => pickAndAnalyze(true)}
              disabled={uploading}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={() => pickAndAnalyze(false)}
              disabled={uploading}
            >
              Upload
            </Button>
          </View>

          {uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator />
              <Text variant="bodySmall" style={styles.stageText}>
                {stageLabel(uploadStage)}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
              {lastAssetRef.current ? (
                <Button
                  mode="text"
                  compact
                  onPress={() => {
                    const asset = lastAssetRef.current;
                    if (asset) processAsset(asset);
                  }}
                >
                  Retry
                </Button>
              ) : null}
            </View>
          ) : null}
        </PremiumCard>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Today&apos;s meals
        </Text>
        {loading && <ActivityIndicator />}
        {!loading && todayMeals.length === 0 ? (
          <Text variant="bodyMedium" style={premiumStyles.empty}>
            No meals yet today. Snap your first plate.
          </Text>
        ) : null}
        {todayMeals.map((meal) => (
          <MealRowCard
            key={meal.id}
            mealName={meal.mealName}
            subtitle={meal.mealType ?? "meal"}
            imageUrl={meal.imageUrl}
            onPress={() => router.push({ pathname: "/meal/edit", params: { id: meal.id } })}
          />
        ))}
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  ctaText: { letterSpacing: 0.2 },
  ctaSub: { opacity: 0.75, marginTop: spacing.xs },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  uploading: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" },
  stageText: { opacity: 0.7 },
  errorBox: { marginTop: spacing.md, gap: spacing.xs },
  errorText: { color: premium.danger },
  section: { paddingHorizontal: spacing.lg, flex: 1, paddingTop: spacing.sm },
  sectionTitle: { marginBottom: spacing.md, letterSpacing: 0.15 },
});
