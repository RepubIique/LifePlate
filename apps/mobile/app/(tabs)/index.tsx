import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton, Snackbar, Text } from "react-native-paper";
import { dateKeyFromIso, formatLogDateLabel, todayDateKey } from "@lifeplate/shared";
import { HydrationQuickAdd } from "@/components/home/HydrationQuickAdd";
import { MealSlotsTracker } from "@/components/home/MealSlotsTracker";
import { TodayAtGlanceCard } from "@/components/home/TodayAtGlanceCard";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { LogDatePickerModal } from "@/components/timeline/LogDatePickerModal";
import { TextLogModal } from "@/components/meal/TextLogModal";
import { HomeDashboardSkeleton, HomeMealsSkeleton } from "@/components/skeletons/HomeSkeletons";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useHydration } from "@/context/HydrationContext";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { getLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { uploadStageLabel, useMealPhotoUpload } from "@/lib/useMealPhotoUpload";
import { openMealEdit } from "@/lib/mealNavigation";
import { formatMealTypeLabel } from "@/lib/mealUtils";
import { spacing } from "@/src/theme/lifeplate";

function isToday(iso: string) {
  return dateKeyFromIso(iso) === todayDateKey();
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const { meals, loading: mealsLoading, refreshing: mealsRefreshing, refreshMeals } = useMeals();
  const {
    dashboard,
    loading: dashboardLoading,
    refreshing: dashboardRefreshing,
    refreshDashboard,
    patchHydration,
  } = useNutritionDashboard();
  const { adjustHydration, syncDate } = useHydration();
  const patchHydrationRef = useRef(patchHydration);
  patchHydrationRef.current = patchHydration;

  const handleTodayHydrationDelta = useCallback(
    (delta: number) => {
      const dateKey = todayDateKey();
      adjustHydration(dateKey, delta);
      if (dashboard) {
        const next = Math.max(
          0,
          Math.min(24, dashboard.essentials.hydration.consumed + delta),
        );
        patchHydrationRef.current(next);
      }
    },
    [adjustHydration, dashboard],
  );
  const { pendingLogDate, setPendingLogDate } = usePendingLogDate();
  const {
    uploadStage,
    error,
    uploading,
    setLogDate,
    setError,
    pickAndAnalyze,
    logWithText,
    retryLastAsset,
    lastAssetRef,
  } = useMealPhotoUpload();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [logDateKey, setLogDateKey] = useState(() => todayDateKey());
  const [logDatePickerOpen, setLogDatePickerOpen] = useState(false);
  const [textLogOpen, setTextLogOpen] = useState(false);
  const [textDescription, setTextDescription] = useState("");
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);

  useEffect(() => {
    getLastPhotoSource().then(setPreferredSource);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (pendingLogDate) {
        setLogDateKey(pendingLogDate);
        setLogDate(pendingLogDate);
        setPendingLogDate(null);
      }
    }, [pendingLogDate, setPendingLogDate, setLogDate]),
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([refreshMeals(), refreshDashboard()]).catch((e) =>
      setSnackbar(friendlyErrorMessage(e)),
    );
  }, [refreshMeals, refreshDashboard]);

  useEffect(() => {
    if (!dashboard) return;
    syncDate(todayDateKey(), dashboard.essentials.hydration.consumed);
  }, [dashboard?.essentials.hydration.consumed, syncDate]);

  const todayMeals = meals.filter((m) => isToday(m.createdAt));
  const showDashboardSkeleton = dashboardLoading && !dashboard;
  const showMealsSkeleton = mealsLoading && meals.length === 0;

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={mealsRefreshing || dashboardRefreshing}
          onRefresh={handleRefresh}
        />
      }
    >
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
          <View style={styles.logDateRow}>
            <View style={styles.logDateCopy}>
              <Text variant="labelLarge" style={styles.logDateLabel}>
                Logging for
              </Text>
              <Text variant="bodyLarge">{formatLogDateLabel(logDateKey)}</Text>
            </View>
            <Button mode="outlined" compact onPress={() => setLogDatePickerOpen(true)}>
              Change
            </Button>
          </View>
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
                void pickAndAnalyze(true, logDateKey);
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
                void pickAndAnalyze(false, logDateKey);
              }}
              disabled={uploading}
            >
              Upload
            </Button>
          </View>

          <Button
            mode="text"
            icon="text-box-outline"
            onPress={() => setTextLogOpen(true)}
            disabled={uploading}
            style={styles.textLogBtn}
          >
            Log without photo
          </Button>

          {uploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator />
              <Text variant="bodySmall" style={styles.stageText}>
                {uploadStageLabel(uploadStage)}
              </Text>
            </View>
          ) : null}
        </PremiumCard>
      </View>

      <View style={styles.dashboard}>
        <MealSlotsTracker
          meals={todayMeals}
          onLogSuggested={() => pickAndAnalyze(preferredSource !== "library", logDateKey)}
        />

        {showDashboardSkeleton ? (
          <HomeDashboardSkeleton />
        ) : dashboard ? (
          <>
            <TodayAtGlanceCard
              dashboard={dashboard}
              onPressInsights={() => router.push("/(tabs)/insights")}
            />
            <HydrationQuickAdd
              pillar={dashboard.essentials.hydration}
              onIncrement={() => handleTodayHydrationDelta(1)}
              onDecrement={() => handleTodayHydrationDelta(-1)}
            />
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Today&apos;s meals
        </Text>
        {!showMealsSkeleton && !mealsLoading && todayMeals.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyMeals}>
            No meals yet today. Snap a photo or log without one.
          </Text>
        ) : null}
        {showMealsSkeleton ? (
          <HomeMealsSkeleton />
        ) : (
          todayMeals.map((meal) => (
            <MealRowCard
              key={meal.id}
              mealId={meal.id}
              mealName={meal.mealName}
              subtitle={formatMealTypeLabel(meal.mealType)}
              imageUrl={meal.imageUrl}
              onPress={() => openMealEdit(meal.id, "home")}
            />
          ))
        )}
      </View>

      <LogDatePickerModal
        visible={logDatePickerOpen}
        selectedDateKey={logDateKey}
        onSelect={(dateKey) => {
          setLogDateKey(dateKey);
          setLogDate(dateKey);
        }}
        onClose={() => setLogDatePickerOpen(false)}
      />

      <TextLogModal
        visible={textLogOpen}
        description={textDescription}
        loading={uploading}
        onChangeDescription={setTextDescription}
        onSubmit={() => {
          void logWithText(textDescription, logDateKey).then(() => {
            setTextLogOpen(false);
            setTextDescription("");
          });
        }}
        onClose={() => {
          if (uploading) return;
          setTextLogOpen(false);
          setTextDescription("");
        }}
      />

      <Snackbar
        visible={!!snackbar || !!error}
        onDismiss={() => {
          setSnackbar(null);
          setError(null);
        }}
        duration={error ? 6000 : 4000}
        action={
          error && lastAssetRef.current
            ? { label: "Retry", onPress: () => void retryLastAsset() }
            : undefined
        }
      >
        {error ?? snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  logDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logDateCopy: { flex: 1, gap: 2 },
  logDateLabel: {
    opacity: 0.55,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  ctaText: { letterSpacing: 0.2 },
  ctaSub: { opacity: 0.75, marginTop: spacing.xs },
  heroActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  textLogBtn: { alignSelf: "center", marginTop: spacing.xs },
  uploading: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" },
  stageText: { opacity: 0.7 },
  dashboard: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  section: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.xs },
  sectionTitle: { marginBottom: spacing.md, letterSpacing: 0.15 },
  emptyMeals: { opacity: 0.6, marginBottom: spacing.sm },
});
