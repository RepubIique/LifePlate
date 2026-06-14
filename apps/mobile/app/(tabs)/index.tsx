import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Chip, IconButton, Snackbar, Text } from "react-native-paper";
import type { ImagePickerAsset } from "expo-image-picker";
import { formatLogDateLabel, todayDateKey } from "@lifeplate/shared";
import { HydrationQuickAdd } from "@/components/home/HydrationQuickAdd";
import { MealSlotsTracker } from "@/components/home/MealSlotsTracker";
import { TodayAtGlanceCard } from "@/components/home/TodayAtGlanceCard";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { uploadMealImage, updateHydration } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { prepareMealImage } from "@/lib/imagePrep";
import { saveToCameraRoll } from "@/lib/saveToCameraRoll";
import { premium } from "@/src/theme/premium";
import { getLastPhotoSource, setLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { formatMealTypeLabel } from "@/lib/mealUtils";
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
  const { meals, loading, loadMeals } = useMeals();
  const { dashboard, loadDashboard, patchHydration } = useNutritionDashboard();
  const { pendingLogDate, setPendingLogDate } = usePendingLogDate();
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [hydrationUpdating, setHydrationUpdating] = useState(false);
  const [logDateKey, setLogDateKey] = useState<string | null>(null);
  const logDateRef = useRef<string | null>(null);
  const lastAssetRef = useRef<ImagePickerAsset | null>(null);
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (pendingLogDate) {
        setLogDateKey(pendingLogDate);
        logDateRef.current = pendingLogDate;
        setPendingLogDate(null);
      }
      void loadMeals().catch((e) => setSnackbar(friendlyErrorMessage(e)));
      void loadDashboard().catch((e) => setSnackbar(friendlyErrorMessage(e)));
      getLastPhotoSource().then(setPreferredSource);
    }, [loadMeals, loadDashboard, pendingLogDate, setPendingLogDate]),
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
          logDate: logDateRef.current ?? "",
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
    if (useCamera) {
      await saveToCameraRoll(asset.uri);
    }
    await processAsset(asset);
  }

  async function changeHydration(nextGlasses: number) {
    if (!dashboard) return;
    setHydrationUpdating(true);
    try {
      const { glasses } = await updateHydration(nextGlasses);
      patchHydration(glasses);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setHydrationUpdating(false);
    }
  }

  const uploading = uploadStage !== "idle";
  const todayMeals = meals.filter((m) => isToday(m.createdAt));

  return (
    <Screen scroll padded={false} loading={loading && meals.length === 0}>
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
          {logDateKey && logDateKey !== todayDateKey() ? (
            <View style={styles.logDateBanner}>
              <Chip
                icon="calendar"
                onClose={() => {
                  setLogDateKey(null);
                  logDateRef.current = null;
                }}
              >
                Logging for {formatLogDateLabel(logDateKey)}
              </Chip>
            </View>
          ) : null}
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

      <View style={styles.dashboard}>
        <MealSlotsTracker
          meals={todayMeals}
          onLogSuggested={() => pickAndAnalyze(preferredSource !== "library")}
        />

        {dashboard ? (
          <>
            <TodayAtGlanceCard
              dashboard={dashboard}
              onPressInsights={() => router.push("/(tabs)/insights")}
            />
            <HydrationQuickAdd
              pillar={dashboard.essentials.hydration}
              updating={hydrationUpdating}
              onIncrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed + 1)
              }
              onDecrement={() =>
                changeHydration(dashboard.essentials.hydration.consumed - 1)
              }
            />
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Today&apos;s meals
        </Text>
        {!loading && todayMeals.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyMeals}>
            No meals yet today. Snap your first plate.
          </Text>
        ) : null}
        {todayMeals.map((meal) => (
          <MealRowCard
            key={meal.id}
            mealName={meal.mealName}
            subtitle={formatMealTypeLabel(meal.mealType)}
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
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  logDateBanner: { marginBottom: spacing.sm },
  ctaText: { letterSpacing: 0.2 },
  ctaSub: { opacity: 0.75, marginTop: spacing.xs },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  uploading: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" },
  stageText: { opacity: 0.7 },
  errorBox: { marginTop: spacing.md, gap: spacing.xs },
  errorText: { color: premium.danger },
  dashboard: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  section: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.xs },
  sectionTitle: { marginBottom: spacing.md, letterSpacing: 0.15 },
  emptyMeals: { opacity: 0.6, marginBottom: spacing.sm },
});
