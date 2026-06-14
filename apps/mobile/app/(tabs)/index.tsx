import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Chip, IconButton, Snackbar, Text } from "react-native-paper";
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
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { useDebouncedHydration } from "@/lib/useDebouncedHydration";
import { premium } from "@/src/theme/premium";
import { getLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { uploadStageLabel, useMealPhotoUpload } from "@/lib/useMealPhotoUpload";
import { formatMealTypeLabel } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const { meals, loading, loadMeals } = useMeals();
  const { dashboard, loadDashboard, patchHydration } = useNutritionDashboard();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const refreshAfterMealChangeRef = useRef(refreshAfterMealChange);
  refreshAfterMealChangeRef.current = refreshAfterMealChange;
  const patchHydrationRef = useRef(patchHydration);
  patchHydrationRef.current = patchHydration;
  const { adjustHydration, syncDate } = useDebouncedHydration({
    onOptimistic: (_dateKey, glasses) => patchHydrationRef.current(glasses),
    onSynced: () => refreshAfterMealChangeRef.current(),
    onError: (e) => setSnackbar(friendlyErrorMessage(e)),
  });
  const { pendingLogDate, setPendingLogDate } = usePendingLogDate();
  const {
    uploadStage,
    error,
    uploading,
    setLogDate,
    pickAndAnalyze,
    retryLastAsset,
    lastAssetRef,
  } = useMealPhotoUpload();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [logDateKey, setLogDateKey] = useState<string | null>(null);
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (pendingLogDate) {
        setLogDateKey(pendingLogDate);
        setLogDate(pendingLogDate);
        setPendingLogDate(null);
      }
      void loadMeals().catch((e) => setSnackbar(friendlyErrorMessage(e)));
      void loadDashboard().catch((e) => setSnackbar(friendlyErrorMessage(e)));
      getLastPhotoSource().then(setPreferredSource);
    }, [loadMeals, loadDashboard, pendingLogDate, setPendingLogDate, setLogDate]),
  );

  useEffect(() => {
    if (!dashboard) return;
    syncDate(todayDateKey(), dashboard.essentials.hydration.consumed);
  }, [dashboard?.essentials.hydration.consumed, syncDate]);

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
                  setLogDate(null);
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
              onPress={() => {
                setPreferredSource("camera");
                void pickAndAnalyze(true);
              }}
              disabled={uploading}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={() => {
                setPreferredSource("library");
                void pickAndAnalyze(false);
              }}
              disabled={uploading}
            >
              Upload
            </Button>
          </View>

          {uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator />
              <Text variant="bodySmall" style={styles.stageText}>
                {uploadStageLabel(uploadStage)}
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
                  onPress={() => void retryLastAsset()}
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
              onIncrement={() => adjustHydration(todayDateKey(), 1)}
              onDecrement={() => adjustHydration(todayDateKey(), -1)}
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
