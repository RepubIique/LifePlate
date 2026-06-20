import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton, Text } from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import {
  buildHydrationPillarFromGlasses,
  dateKeyFromIso,
  formatLogDateLabel,
  todayDateKey,
} from "@lifeplate/shared";
import { HydrationQuickAdd } from "@/components/home/HydrationQuickAdd";
import { MealSlotsTracker } from "@/components/home/MealSlotsTracker";
import { TodayAtGlanceCard } from "@/components/home/TodayAtGlanceCard";
import { MealLogDateField } from "@/components/meal/MealLogDateField";
import { MealRowCard } from "@/components/MealRowCard";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { TextLogModal } from "@/components/meal/TextLogModal";
import { HomeDashboardSkeleton, HomeMealsSkeleton } from "@/components/skeletons/HomeSkeletons";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { useHydration } from "@/context/HydrationContext";
import { usePendingLogDate } from "@/context/PendingLogDateContext";
import { fetchNutritionDashboard } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { getLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";
import { uploadStageLabel, useMealPhotoUpload } from "@/lib/useMealPhotoUpload";
import { openMealEdit } from "@/lib/mealNavigation";
import { formatMealTypeLabel } from "@/lib/mealUtils";
import { expandDashboard, type NutritionDashboardView } from "@/lib/nutritionDashboardView";
import { spacing } from "@/src/theme/lifeplate";

function mealsForDate(iso: string, dateKey: string) {
  return dateKeyFromIso(iso) === dateKey;
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
  const dayDashboardCacheRef = useRef<Map<string, NutritionDashboardView>>(new Map());

  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [logDateKey, setLogDateKey] = useState(() => todayDateKey());
  const [textLogOpen, setTextLogOpen] = useState(false);
  const [textDescription, setTextDescription] = useState("");
  const [preferredSource, setPreferredSource] = useState<PhotoSource | null>(null);
  const [dayDashboard, setDayDashboard] = useState<NutritionDashboardView | null>(null);
  const [dayDashboardLoading, setDayDashboardLoading] = useState(false);

  const isViewingToday = logDateKey === todayDateKey();
  const activeDashboard = isViewingToday ? dashboard : dayDashboard;
  const glanceTitle = isViewingToday
    ? "Today at a glance"
    : `${formatLogDateLabel(logDateKey)} at a glance`;
  const mealsTitle = isViewingToday
    ? "Today's meals"
    : `${formatLogDateLabel(logDateKey)}'s meals`;

  const handleHydrationDelta = useCallback(
    (delta: number) => {
      adjustHydration(logDateKey, delta);
      if (!activeDashboard) return;

      const target = profile?.nutritionTargets?.dailyHydrationGlasses ?? 8;
      const next = Math.max(
        0,
        Math.min(24, activeDashboard.essentials.hydration.consumed + delta),
      );
      const hydration = buildHydrationPillarFromGlasses(next, target);

      if (isViewingToday) {
        patchHydrationRef.current(next);
        return;
      }

      setDayDashboard((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          essentials: { ...prev.essentials, hydration },
        };
        dayDashboardCacheRef.current.set(logDateKey, updated);
        return updated;
      });
    },
    [adjustHydration, activeDashboard, isViewingToday, logDateKey, profile?.nutritionTargets?.dailyHydrationGlasses],
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

  const dayMeals = useMemo(
    () => meals.filter((m) => mealsForDate(m.createdAt, logDateKey)),
    [meals, logDateKey],
  );
  const dayMealsRevision = useMemo(
    () => dayMeals.map((m) => `${m.id}:${m.calories ?? 0}:${m.protein ?? 0}`).join("|"),
    [dayMeals],
  );

  useEffect(() => {
    getLastPhotoSource().then(setPreferredSource);
  }, []);

  useEffect(() => {
    if (isViewingToday) {
      setDayDashboard(null);
      setDayDashboardLoading(false);
      return;
    }

    let cancelled = false;
    setDayDashboardLoading(true);
    void fetchNutritionDashboard(logDateKey)
      .then((raw) => {
        if (cancelled) return;
        const next = expandDashboard(raw, profile?.nutritionTargets ?? null);
        dayDashboardCacheRef.current.set(logDateKey, next);
        setDayDashboard(next);
      })
      .catch((e) => {
        if (!cancelled) setSnackbar(friendlyErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setDayDashboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isViewingToday, logDateKey, dayMealsRevision, profile?.nutritionTargets]);

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
    const tasks: Promise<unknown>[] = [refreshMeals()];
    if (isViewingToday) {
      tasks.push(refreshDashboard());
    } else {
      dayDashboardCacheRef.current.delete(logDateKey);
      setDayDashboardLoading(true);
      tasks.push(
        fetchNutritionDashboard(logDateKey)
          .then((raw) => {
            const next = expandDashboard(raw, profile?.nutritionTargets ?? null);
            dayDashboardCacheRef.current.set(logDateKey, next);
            setDayDashboard(next);
          })
          .finally(() => setDayDashboardLoading(false)),
      );
    }
    void Promise.all(tasks).catch((e) => setSnackbar(friendlyErrorMessage(e)));
  }, [isViewingToday, logDateKey, profile?.nutritionTargets, refreshDashboard, refreshMeals]);

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
          <IconButton
            icon="account-circle-outline"
            onPress={() => router.push("/(tabs)/profile")}
          />
        }
      />

      <View style={styles.hero}>
        <PremiumCard>
          <MealLogDateField
            dateKey={logDateKey}
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
          meals={dayMeals}
          onLogSuggested={() => pickAndAnalyze(preferredSource !== "library", logDateKey)}
        />

        {showDashboardSkeleton ? (
          <HomeDashboardSkeleton />
        ) : activeDashboard ? (
          <>
            <TodayAtGlanceCard
              dashboard={activeDashboard}
              title={glanceTitle}
              onPressInsights={() => router.push("/(tabs)/insights")}
            />
            <HydrationQuickAdd
              pillar={activeDashboard.essentials.hydration}
              onIncrement={() => handleHydrationDelta(1)}
              onDecrement={() => handleHydrationDelta(-1)}
            />
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {mealsTitle}
        </Text>
        {!showMealsSkeleton && !mealsLoading && dayMeals.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyMeals}>
            {isViewingToday
              ? "No meals yet today. Snap a photo or log without one."
              : `No meals logged for ${formatLogDateLabel(logDateKey).toLowerCase()}.`}
          </Text>
        ) : null}
        {showMealsSkeleton ? (
          <HomeMealsSkeleton />
        ) : (
          dayMeals.map((meal) => (
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
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  ctaText: { letterSpacing: 0.2, marginTop: spacing.sm },
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
