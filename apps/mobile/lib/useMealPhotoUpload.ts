import * as Linking from "expo-linking";
import { router } from "expo-router";
import { todayDateKey } from "@lifeplate/shared";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import { Alert } from "react-native";
import { uploadMealImage, analyzeMealText } from "@/lib/api";
import {
  isRetryableError,
  mealFlowErrorMessage,
  mediaPermissionMessage,
} from "@/lib/apiErrors";
import { prepareMealImage } from "@/lib/imagePrep";
import { saveMealUploadSession } from "@/lib/mealUploadSession";
import { saveToCameraRoll } from "@/lib/saveToCameraRoll";
import { setLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";

export type UploadStage = "idle" | "preparing" | "analyzing" | "analyzing-text";

export function uploadStageLabel(
  stage: UploadStage,
  pickingSource?: PhotoSource | null,
): string {
  if (pickingSource === "camera") return "Opening camera…";
  if (pickingSource === "library") return "Opening photo library…";
  if (stage === "preparing") return "Preparing photo…";
  if (stage === "analyzing") return "Analyzing your meal…";
  if (stage === "analyzing-text") return "Estimating nutrition…";
  return "";
}

export function useMealPhotoUpload() {
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [pickingSource, setPickingSource] = useState<PhotoSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const logDateRef = useRef<string | null>(null);
  const lastAssetRef = useRef<ImagePickerAsset | null>(null);
  const lastTextLogRef = useRef<{ description: string; logDateKey: string } | null>(null);

  const setLogDate = useCallback((dateKey: string | null) => {
    logDateRef.current = dateKey;
  }, []);

  const navigateToResult = useCallback(
    (
      analysis: Awaited<ReturnType<typeof uploadMealImage>>,
      options?: { isTextLog?: boolean; localImageUri?: string },
    ) => {
      lastTextLogRef.current = null;
      saveMealUploadSession(analysis.draftId, {
        ...analysis,
        localImageUri: options?.localImageUri,
        isTextLog: options?.isTextLog,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/meal/result",
        params: {
          draftId: analysis.draftId,
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
          logDate: logDateRef.current ?? todayDateKey(),
          isTextLog: options?.isTextLog ? "true" : undefined,
        },
      });
    },
    [],
  );

  const processAsset = useCallback(
    async (asset: ImagePickerAsset) => {
      setError(null);
      setCanRetry(false);
      setUploadStage("preparing");
      try {
        const prepared = await prepareMealImage(asset.uri);
        setUploadStage("analyzing");
        const analysis = await uploadMealImage(prepared);
        navigateToResult(analysis, { localImageUri: prepared.uri });
      } catch (e) {
        const retryable = isRetryableError(e);
        setCanRetry(retryable);
        setError(mealFlowErrorMessage(e, "upload"));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setUploadStage("idle");
      }
    },
    [navigateToResult],
  );

  const logWithText = useCallback(
    async (description: string, logDate?: string | null) => {
      const trimmed = description.trim();
      if (!trimmed) {
        setError("Describe what you ate first.");
        setCanRetry(false);
        return;
      }

      if (logDate !== undefined) {
        logDateRef.current = logDate;
      }

      const logDateKey = logDateRef.current ?? todayDateKey();
      setError(null);
      setCanRetry(false);
      setUploadStage("analyzing-text");
      lastTextLogRef.current = { description: trimmed, logDateKey };
      try {
        const analysis = await analyzeMealText(trimmed);
        navigateToResult(analysis, { isTextLog: true });
      } catch (e) {
        const retryable = isRetryableError(e);
        setCanRetry(retryable);
        setError(mealFlowErrorMessage(e, "analyze-text"));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setUploadStage("idle");
      }
    },
    [navigateToResult],
  );

  const pickAndAnalyze = useCallback(
    async (useCamera: boolean, logDate?: string | null) => {
      if (logDate !== undefined) {
        logDateRef.current = logDate;
      }

      const source: PhotoSource = useCamera ? "camera" : "library";
      setPickingSource(source);

      try {
        const permission = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          const message = mediaPermissionMessage(
            useCamera ? "camera" : "library",
            permission.canAskAgain,
          );
          if (permission.canAskAgain === false) {
            Alert.alert("Permission needed", message, [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => void Linking.openSettings() },
            ]);
          } else {
            setError(message);
            setCanRetry(false);
          }
          return;
        }

        await setLastPhotoSource(source);

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
        setPickingSource(null);
        if (useCamera) {
          await saveToCameraRoll(asset.uri);
        }
        await processAsset(asset);
      } finally {
        setPickingSource(null);
      }
    },
    [processAsset],
  );

  const retryLastAsset = useCallback(async () => {
    const asset = lastAssetRef.current;
    if (asset) {
      await processAsset(asset);
      return;
    }
    const textLog = lastTextLogRef.current;
    if (textLog) {
      await logWithText(textLog.description, textLog.logDateKey);
    }
  }, [logWithText, processAsset]);

  const hasRetryTarget = Boolean(lastAssetRef.current || lastTextLogRef.current);

  return {
    uploadStage,
    pickingSource,
    error,
    canRetry,
    hasRetryTarget,
    uploading: uploadStage !== "idle" || pickingSource !== null,
    logDateRef,
    setLogDate,
    pickAndAnalyze,
    logWithText,
    processAsset,
    retryLastAsset,
    lastAssetRef,
    setError,
  };
}
