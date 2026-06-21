import {
  buildMealPortionMeta,
  loggedAtForDateKey,
  type MealUploadResponse,
} from "@lifeplate/shared";
import { router } from "expo-router";
import type { ImagePickerAsset } from "expo-image-picker";
import { analyzeMealText, confirmMeal, uploadMealImage } from "@/lib/api";
import { saveMealImage } from "@/lib/mealImages";
import {
  clearPendingConfirm,
  clearPendingUpload,
  clearPendingUploadMeta,
  loadPendingConfirm,
  loadPendingUpload,
  type PendingMealConfirmForm,
  type PendingUpload,
} from "@/lib/mealPendingStorage";
import { saveMealUploadSession } from "@/lib/mealUploadSession";

export type PendingAnalysisResult = {
  analysis: MealUploadResponse;
  logDateKey: string;
  localImageUri?: string;
  isTextLog?: boolean;
};

export function pendingUploadToAsset(upload: PendingUpload): ImagePickerAsset | null {
  if (upload.kind !== "photo") return null;
  return {
    uri: upload.photoUri,
    width: 0,
    height: 0,
  };
}

export function navigateToMealResult(
  analysis: MealUploadResponse,
  options: { logDateKey: string; localImageUri?: string; isTextLog?: boolean },
  userId?: string | null,
): void {
  saveMealUploadSession(analysis.draftId, {
    ...analysis,
    localImageUri: options.localImageUri,
    isTextLog: options.isTextLog,
  });
  if (userId) {
    void clearPendingUploadMeta(userId);
  }
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
      logDate: options.logDateKey,
      isTextLog: options.isTextLog ? "true" : undefined,
    },
  });
}

export function navigateToPendingConfirm(form: PendingMealConfirmForm): void {
  saveMealUploadSession(form.draftId, {
    draftId: form.draftId,
    mealName: form.mealName,
    foods: form.foods,
    estimatedCalories: form.baseMacros.estimatedCalories,
    protein: form.baseMacros.protein,
    carbs: form.baseMacros.carbs,
    fat: form.baseMacros.fat,
    fibre: form.baseMacros.fibre,
    sugar: form.baseMacros.sugar,
    sodium: form.baseMacros.sodium,
    confidence: form.confidence,
    imageUrl: form.cloudImageUrl,
    coachNudge: form.coachNudge,
    localImageUri: form.localImageUri,
    isTextLog: form.isTextLog,
  });
  router.push({
    pathname: "/meal/result",
    params: {
      draftId: form.draftId,
      mealName: form.mealName,
      foods: JSON.stringify(form.foods),
      estimatedCalories: String(form.calories),
      protein: String(form.protein),
      carbs: String(form.carbs),
      fat: String(form.fat),
      fibre: String(form.fibre),
      sugar: String(form.sugar),
      sodium: String(form.sodium),
      confidence: String(form.confidence),
      coachNudge: form.coachNudge,
      logDate: form.logDate,
      loggedAt: form.loggedAt ?? loggedAtForDateKey(form.logDate, form.mealType),
      isTextLog: form.isTextLog ? "true" : undefined,
    },
  });
}

export async function retryPendingUpload(
  userId: string,
): Promise<PendingAnalysisResult | null> {
  const pending = await loadPendingUpload(userId);
  if (!pending) return null;

  if (pending.kind === "text") {
    const analysis = await analyzeMealText(pending.description);
    await clearPendingUploadMeta(userId);
    return {
      analysis,
      logDateKey: pending.logDateKey,
      isTextLog: true,
    };
  }

  const localImageUri = pending.photoUri;
  const analysis = await uploadMealImage({
    uri: pending.photoUri,
    mimeType: pending.mimeType,
    fileName: pending.fileName,
  });
  await clearPendingUploadMeta(userId);
  return {
    analysis,
    logDateKey: pending.logDateKey,
    localImageUri,
  };
}

export async function retryPendingConfirm(
  userId: string,
): Promise<{ ok: true; mealId: string } | { ok: false; error: unknown }> {
  const pending = await loadPendingConfirm(userId);
  if (!pending) {
    return { ok: false, error: new Error("No pending confirm") };
  }

  const { form } = pending;
  try {
    const { id } = await confirmMeal({
      draftId: form.draftId,
      imageUrl: form.cloudImageUrl || undefined,
      mealName: form.mealName,
      mealType: form.mealType,
      foods: form.foods,
      estimatedCalories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      fibre: form.fibre,
      sugar: form.sugar,
      sodium: form.sodium,
      confidence: form.confidence,
      portionMeta: buildMealPortionMeta(
        form.baseMacros,
        form.totalPortions,
        form.portionsEaten,
      ),
      loggedAt: form.loggedAt ?? loggedAtForDateKey(form.logDate, form.mealType),
      shareWithFriendIds:
        form.selectedFriendIds.length > 0 ? form.selectedFriendIds : undefined,
    });
    if (form.localImageUri) {
      await saveMealImage(id, form.localImageUri);
    }
    await clearPendingConfirm(userId);
    return { ok: true, mealId: id };
  } catch (error) {
    return { ok: false, error };
  }
}
