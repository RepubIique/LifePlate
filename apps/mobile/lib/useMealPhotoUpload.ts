import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import { uploadMealImage } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { prepareMealImage } from "@/lib/imagePrep";
import { saveMealUploadSession } from "@/lib/mealUploadSession";
import { saveToCameraRoll } from "@/lib/saveToCameraRoll";
import { setLastPhotoSource, type PhotoSource } from "@/lib/uploadPrefs";

export type UploadStage = "idle" | "preparing" | "analyzing";

export function uploadStageLabel(stage: UploadStage): string {
  if (stage === "preparing") return "Preparing photo…";
  if (stage === "analyzing") return "Analyzing your meal…";
  return "";
}

export function useMealPhotoUpload() {
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const logDateRef = useRef<string | null>(null);
  const lastAssetRef = useRef<ImagePickerAsset | null>(null);

  const setLogDate = useCallback((dateKey: string | null) => {
    logDateRef.current = dateKey;
  }, []);

  const processAsset = useCallback(async (asset: ImagePickerAsset) => {
    setError(null);
    setUploadStage("preparing");
    try {
      const prepared = await prepareMealImage(asset.uri);
      setUploadStage("analyzing");
      const analysis = await uploadMealImage(prepared);
      saveMealUploadSession(analysis.draftId, {
        ...analysis,
        localImageUri: prepared.uri,
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
          estimatedServings: String(analysis.estimatedServings ?? 1),
          logDate: logDateRef.current ?? "",
        },
      });
    } catch (e) {
      setError(friendlyErrorMessage(e));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadStage("idle");
    }
  }, []);

  const pickAndAnalyze = useCallback(
    async (useCamera: boolean, logDate?: string | null) => {
      if (logDate !== undefined) {
        logDateRef.current = logDate;
      }

      const source: PhotoSource = useCamera ? "camera" : "library";
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission required to access photos or camera.");
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
      if (useCamera) {
        await saveToCameraRoll(asset.uri);
      }
      await processAsset(asset);
    },
    [processAsset],
  );

  const retryLastAsset = useCallback(async () => {
    const asset = lastAssetRef.current;
    if (asset) await processAsset(asset);
  }, [processAsset]);

  return {
    uploadStage,
    error,
    uploading: uploadStage !== "idle",
    logDateRef,
    setLogDate,
    pickAndAnalyze,
    processAsset,
    retryLastAsset,
    lastAssetRef,
    setError,
  };
}
