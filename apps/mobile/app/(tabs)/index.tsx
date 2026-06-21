import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { ProfileNavButton } from "@/components/profile/ProfileNavButton";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import {
  dateKeyFromIso,
  formatLogDateLabel,
  FREE_LOGGING_DAYS,
  mealLogDateKey,
  todayDateKey,
} from "@lifeplate/shared";
import { HomeDayMealsSection } from "@/components/home/HomeDayMealsSection";
import { HydrationQuickAdd } from "@/components/home/HydrationQuickAdd";
import { MealSlotsTracker } from "@/components/home/MealSlotsTracker";
import { TodayAtGlanceCard } from "@/components/home/TodayAtGlanceCard";
import { MealLogDateField, loggedAtFromDateKey } from "@/components/meal/MealLogDateField";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { TextLogModal } from "@/components/meal/TextLogModal";
import { HomeDashboardSkeleton } from "@/components/skeletons/HomeSkeletons";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/context/GamificationContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useHydration } from "@/context/HydrationContext";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { useWidgetQuickAction } from "@/context/WidgetQuickActionContext";
import { friendlyErrorMessage, hydrationSyncErrorMessage } from "@/lib/apiErrors";
import { getLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { uploadStageLabel, useMealPhotoUpload } from "@/lib/useMealPhotoUpload";
import { useDayDashboard } from "@/lib/useDayDashboard";
import { refreshDashboardCoaching } from "@/lib/nutritionDashboardView";
import { openMealEdit } from "@/lib/mealNavigation";
import { useGamificationCelebrations } from "@/lib/useGamificationCelebrations";
import { useLoggingAccess } from "@/lib/useLoggingAccess";
import { spacing } from "@/src/theme/lifeplate";

export default function HomeScreen() {
  const { profile } = useAuth();
  const { requireLoggingAccess, loggingLocked, daysRemaining } = useLoggingAccess();
  const { celebration, dismissCelebration, checkCelebrations } = useGamificationCelebrations();
  const { meals, loading: mealsLoading, refreshing: mealsRefreshing, loadMeals, refreshMeals } = useMeals();
  const {
    dashboard,
    loading: dashboardLoading,
    refreshing: dashboardRefreshing,
    loadDashboard,
    refreshDashboard,
    patchHydration,
  } = useNutritionDashboard();
  const { loadGamification } = useGamification();
  const { adjustHydration, syncDate, syncFailedDate, retryHydrationSync, dismissSyncFailure } =
    useHydration();
  const { consumeCameraLog } = useWidgetQuickAction();
  const patchHydrationRef = useRef(patchHydration);
  patchHydrationRef.current = patchHydration;

  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [logDateKey, setLogDateKey] = useState(() => todayDateKey());
  const [textLogOpen, setTextLogOpen] = useState(false);
  const [textDescription, setTextDescription] = useState("");
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);

  const isViewingToday = logDateKey === todayDateKey();
  const hydrationTarget = profile?.nutritionTargets?.dailyHydrationGlasses ?? 8;

  const dayMeals = useMemo(
    () => meals.filter((m) => mealLogDateKey(m) === logDateKey),
    [meals, logDateKey],
  );
  const dayMealsRevision = useMemo(
    () => dayMeals.map((m) => `${m.id}:${m.calories ?? 0}:${m.protein ?? 0}`).join("|"),
    [dayMeals],
  );

  const {
    dashboard: dayDashboard,
    loading: dayDashboardLoading,
    loadFailed: dayDashboardLoadFailed,
    refresh: refreshDayDashboard,
    patchHydration: patchDayHydration,
  } = useDayDashboard({
    dateKey: logDateKey,
    mealsRevision: dayMealsRevision,
    enabled: !isViewingToday,
    nutritionTargets: profile?.nutritionTargets,
    hydrationTarget,
    onError: (e) => setSnackbar(friendlyErrorMessage(e)),
  });

  const dayMealTypes = useMemo(
    () => [
      ...new Set(
        dayMeals
          .map((m) => m.mealType?.trim().toLowerCase())
          .filter((type): type is string => !!type),
      ),
    ],
    [dayMeals],
  );

  const activeDashboard = isViewingToday ? dashboard : dayDashboard;
  const glanceDashboard = useMemo(() => {
    if (!activeDashboard) return null;
    if (!isViewingToday || dayMealTypes.length === 0) return activeDashboard;
    return {
      ...activeDashboard,
      ...refreshDashboardCoaching(
        activeDashboard,
        profile?.nutritionTargets ?? null,
        dayMealTypes,
        dayMeals.length,
      ),
    };
  }, [
    activeDashboard,
    dayMealTypes,
    dayMeals.length,
    isViewingToday,
    profile?.nutritionTargets,
  ]);
  const glanceTitle = isViewingToday
    ? "Today at a glance"
    : `${formatLogDateLabel(logDateKey)} at a glance`;
  const mealsTitle = isViewingToday
    ? "Today's meals"
    : `${formatLogDateLabel(logDateKey)}'s meals`;
  const slotsTitle = isViewingToday
    ? "Today's plates"
    : `${formatLogDateLabel(logDateKey)}'s plates`;

  const handleHydrationDelta = useCallback(
    (delta: number) => {
      adjustHydration(logDateKey, delta);
      if (!activeDashboard) return;

      const next = Math.max(
        0,
        Math.min(24, activeDashboard.essentials.hydration.consumed + delta),
      );

      if (isViewingToday) {
        patchHydrationRef.current(next);
        return;
      }

      patchDayHydration(next);
    },
    [adjustHydration, activeDashboard, isViewingToday, logDateKey, patchDayHydration],
  );
  const { pendingLogDate, setPendingLogDate } = usePendingLogDate();
  const {
    uploadStage,
    pickingSource,
    error,
    canRetry,
    uploading,
    setLogDate,
    setError,
    pickAndAnalyze,
    logWithText,
    retryLastAsset,
    lastAssetRef,
    hasRetryTarget,
  } = useMealPhotoUpload({ guardLogging: requireLoggingAccess });

  useEffect(() => {
    getLastPhotoSource().then(setPreferredSource);
  }, []);

  useEffect(() => {
    if (!syncFailedDate) return;
    setSnackbar(hydrationSyncErrorMessage());
  }, [syncFailedDate]);

  useFocusEffect(
    useCallback(() => {
      if (pendingLogDate) {
        setLogDateKey(pendingLogDate);
        setLogDate(pendingLogDate);
        setPendingLogDate(null);
      }
      if (consumeCameraLog()) {
        const today = todayDateKey();
        setLogDateKey(today);
        setLogDate(today);
        setPreferredSource("camera");
        void pickAndAnalyze(true, today);
      }
      void loadMeals();
      if (isViewingToday) void loadDashboard();
      void loadGamification();
    }, [
      pendingLogDate,
      setPendingLogDate,
      setLogDate,
      consumeCameraLog,
      pickAndAnalyze,
      setLogDate,
      loadMeals,
      loadDashboard,
      loadGamification,
      isViewingToday,
    ]),
  );

  const handleRefresh = useCallback(() => {
    const tasks: Promise<unknown>[] = [refreshMeals()];
    if (isViewingToday) {
      tasks.push(refreshDashboard());
    } else {
      tasks.push(refreshDayDashboard());
    }
    void Promise.all(tasks).catch((e) => setSnackbar(friendlyErrorMessage(e)));
  }, [isViewingToday, refreshDashboard, refreshDayDashboard, refreshMeals]);

  useEffect(() => {
    if (!dashboard || !isViewingToday) return;
    syncDate(todayDateKey(), dashboard.essentials.hydration.consumed);
  }, [dashboard?.essentials.hydration.consumed, isViewingToday, syncDate]);

  const showDashboardSkeleton =
    (isViewingToday && dashboardLoading && !dashboard) ||
    (!isViewingToday && dayDashboardLoading && !dayDashboard);
  const showMealsSkeleton = mealsLoading && meals.length === 0;

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={mealsRefreshing || (isViewingToday ? dashboardRefreshing : dayDashboardLoading)}
          onRefresh={handleRefresh}
        />
      }
    >
      <PremiumHeader
        title="LifePlate"
        subtitle={`${profile?.currentStreak ?? 0} day streak`}
        right={
          <ProfileNavButton onPress={() => router.push("/profile")} />
        }
      />

      <View style={styles.hero}>
        <PremiumCard>
        {loggingLocked ? (
          <>
            <Text variant="titleLarge" style={styles.ctaText}>
              Your free week has ended
            </Text>
            <Text variant="bodyMedium" style={styles.ctaSub}>
              Upgrade to LifePlate Plus to keep logging meals and building your health story.
            </Text>
            <Button
              mode="contained"
              icon="star-circle-outline"
              onPress={() => requireLoggingAccess()}
              style={styles.upgradeButton}
            >
              See LifePlate Plus
            </Button>
          </>
        ) : (
          <>
        <MealLogDateField
          loggedAt={loggedAtFromDateKey(logDateKey)}
          showTime={false}
          onChange={(loggedAt) => {
            const dateKey = dateKeyFromIso(loggedAt);
            setLogDateKey(dateKey);
            setLogDate(dateKey);
          }}
        />
          <Text variant="titleLarge" style={styles.ctaText}>
            What are you eating?
          </Text>
          <Text variant="bodyMedium" style={styles.ctaSub}>
            {daysRemaining > 0 && daysRemaining <= FREE_LOGGING_DAYS && !profile?.isPaid
              ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in your free trial. `
              : ""}
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
              style={styles.heroActionBtn}
              contentStyle={styles.heroActionBtnContent}
              loading={pickingSource === "camera"}
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
              style={styles.heroActionBtn}
              contentStyle={styles.heroActionBtnContent}
              loading={pickingSource === "library"}
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
                {uploadStageLabel(uploadStage, pickingSource)}
              </Text>
            </View>
          ) : null}
          </>
        )}
        </PremiumCard>
      </View>

      <View style={styles.dashboard}>
        <MealSlotsTracker
          meals={dayMeals}
          title={slotsTitle}
          onLogSuggested={
            loggingLocked ? undefined : () => pickAndAnalyze(preferredSource !== "library", logDateKey)
          }
        />

        {!isViewingToday && dayDashboardLoadFailed && !dayDashboard && !dayDashboardLoading ? (
          <PremiumCard style={styles.errorCard}>
            <Text variant="bodyMedium" style={styles.errorText}>
              Couldn&apos;t load nutrition for {formatLogDateLabel(logDateKey).toLowerCase()}.
            </Text>
            <Button mode="outlined" onPress={() => void refreshDayDashboard()}>
              Try again
            </Button>
          </PremiumCard>
        ) : null}

        {showDashboardSkeleton ? (
          <HomeDashboardSkeleton />
        ) : glanceDashboard ? (
          <>
            <TodayAtGlanceCard
              dashboard={glanceDashboard}
              title={glanceTitle}
              onPressInsights={() => router.push("/(tabs)/insights")}
            />
            <HydrationQuickAdd
              pillar={glanceDashboard.essentials.hydration}
              onIncrement={() => handleHydrationDelta(1)}
              onDecrement={() => handleHydrationDelta(-1)}
            />
          </>
        ) : null}
      </View>

      <HomeDayMealsSection
        title={mealsTitle}
        meals={dayMeals}
        loading={mealsLoading}
        showSkeleton={showMealsSkeleton}
        isViewingToday={isViewingToday}
        dateLabel={formatLogDateLabel(logDateKey)}
        onMealPress={(mealId) => openMealEdit(mealId, "home")}
        onLogSuggested={
          isViewingToday && !loggingLocked
            ? () => pickAndAnalyze(preferredSource !== "library", logDateKey)
            : undefined
        }
        onLogPhoto={
          isViewingToday && !loggingLocked
            ? () => pickAndAnalyze(preferredSource !== "library", logDateKey)
            : undefined
        }
        onLogText={isViewingToday && !loggingLocked ? () => setTextLogOpen(true) : undefined}
      />

      <TextLogModal
        visible={textLogOpen}
        description={textDescription}
        logDateKey={logDateKey}
        loading={uploading}
        onChangeDescription={setTextDescription}
        onChangeLogDateKey={(dateKey) => {
          setLogDateKey(dateKey);
          setLogDate(dateKey);
        }}
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

      <BottomSnackbar
        visible={!!snackbar || !!error || !!celebration}
        onDismiss={() => {
          setSnackbar(null);
          setError(null);
          dismissCelebration();
          dismissSyncFailure();
        }}
        duration={error || syncFailedDate ? 6000 : celebration ? 5000 : 4000}
        action={
          error && canRetry && hasRetryTarget
            ? { label: "Retry", onPress: () => void retryLastAsset() }
            : syncFailedDate
              ? {
                  label: "Retry",
                  onPress: () => void retryHydrationSync(syncFailedDate),
                }
              : undefined
        }
      >
        {error ?? snackbar ?? celebration?.message}
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  ctaText: { letterSpacing: 0.2, marginTop: spacing.sm },
  ctaSub: { opacity: 0.75, marginTop: spacing.xs },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: "center",
  },
  heroActionBtn: { flex: 1 },
  heroActionBtnContent: { height: 44 },
  upgradeButton: { marginTop: spacing.lg, alignSelf: "flex-start" },
  textLogBtn: { alignSelf: "center", marginTop: spacing.xs },
  uploading: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stageText: { opacity: 0.7 },
  dashboard: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  errorCard: { gap: spacing.sm, alignItems: "flex-start" },
  errorText: { opacity: 0.7, lineHeight: 22 },
});
