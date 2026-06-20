import type { MealMacroTotals, MealType } from "@lifeplate/shared";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { copyUriToFile } from "@/lib/localFileOps";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const CONFIRM_TTL_MS = 30 * 60 * 1000;

export type PendingPhotoUpload = {
  kind: "photo";
  photoUri: string;
  mimeType: string;
  fileName: string;
  logDateKey: string;
  createdAt: number;
};

export type PendingTextLog = {
  kind: "text";
  description: string;
  logDateKey: string;
  createdAt: number;
};

export type PendingUpload = PendingPhotoUpload | PendingTextLog;

export type PendingMealConfirmForm = {
  draftId: string;
  mealName: string;
  mealType: MealType;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
  confidence: number;
  logDate: string;
  totalPortions: number;
  portionsEaten: number;
  cloudImageUrl: string;
  localImageUri: string;
  isTextLog: boolean;
  selectedFriendIds: string[];
  baseMacros: MealMacroTotals;
  coachNudge: string;
};

export type PendingMealConfirm = {
  form: PendingMealConfirmForm;
  createdAt: number;
};

function uploadKey(userId: string): string {
  return `lifeplate:pending-upload:${userId}`;
}

function confirmKey(userId: string): string {
  return `lifeplate:pending-confirm:${userId}`;
}

function pendingMealsDir(): Directory {
  return new Directory(Paths.document, "pending-meals");
}

function pendingPhotoFile(): File {
  return new File(pendingMealsDir(), "upload.jpg");
}

function pendingConfirmImageFile(): File {
  return new File(pendingMealsDir(), "confirm.jpg");
}

function isExpired(createdAt: number, ttlMs: number): boolean {
  return Date.now() - createdAt > ttlMs;
}

async function persistPhotoCopy(sourceUri: string): Promise<string> {
  if (Platform.OS === "web") return sourceUri;
  const dest = pendingPhotoFile();
  await copyUriToFile(sourceUri, dest);
  return dest.uri;
}

async function persistConfirmImageCopy(sourceUri: string): Promise<string> {
  if (!sourceUri.trim()) return "";
  if (Platform.OS === "web") return sourceUri;
  const dest = pendingConfirmImageFile();
  await copyUriToFile(sourceUri, dest);
  return dest.uri;
}

async function deletePendingPhotoFile(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const file = pendingPhotoFile();
    if (file.exists) file.delete();
  } catch {
    // Best-effort cleanup.
  }
}

async function deletePendingConfirmImageFile(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const file = pendingConfirmImageFile();
    if (file.exists) file.delete();
  } catch {
    // Best-effort cleanup.
  }
}

export async function savePendingPhotoUpload(
  userId: string,
  input: {
    photoUri: string;
    mimeType: string;
    fileName: string;
    logDateKey: string;
  },
): Promise<void> {
  const photoUri = await persistPhotoCopy(input.photoUri);
  const payload: PendingUpload = {
    kind: "photo",
    photoUri,
    mimeType: input.mimeType,
    fileName: input.fileName,
    logDateKey: input.logDateKey,
    createdAt: Date.now(),
  };
  await writeSecureStoreJson(uploadKey(userId), payload);
}

export async function savePendingTextLog(
  userId: string,
  description: string,
  logDateKey: string,
): Promise<void> {
  const payload: PendingUpload = {
    kind: "text",
    description,
    logDateKey,
    createdAt: Date.now(),
  };
  await writeSecureStoreJson(uploadKey(userId), payload);
}

export async function loadPendingUpload(userId: string): Promise<PendingUpload | null> {
  const payload = await readSecureStoreJson<PendingUpload>(uploadKey(userId));
  if (!payload) return null;
  if (isExpired(payload.createdAt, UPLOAD_TTL_MS)) {
    await clearPendingUpload(userId);
    return null;
  }
  if (payload.kind === "photo" && Platform.OS !== "web") {
    const file = pendingPhotoFile();
    if (!file.exists) {
      await clearPendingUpload(userId);
      return null;
    }
    return { ...payload, photoUri: file.uri };
  }
  return payload;
}

export async function clearPendingUpload(userId: string): Promise<void> {
  await removeSecureStoreEntry(uploadKey(userId));
  await deletePendingPhotoFile();
}

export async function savePendingConfirm(
  userId: string,
  form: PendingMealConfirmForm,
): Promise<void> {
  const localImageUri = await persistConfirmImageCopy(form.localImageUri);
  const payload: PendingMealConfirm = {
    form: { ...form, localImageUri },
    createdAt: Date.now(),
  };
  await writeSecureStoreJson(confirmKey(userId), payload);
}

export async function loadPendingConfirm(userId: string): Promise<PendingMealConfirm | null> {
  const payload = await readSecureStoreJson<PendingMealConfirm>(confirmKey(userId));
  if (!payload) return null;
  if (isExpired(payload.createdAt, CONFIRM_TTL_MS)) {
    await clearPendingConfirm(userId);
    return null;
  }
  if (payload.form.localImageUri && Platform.OS !== "web") {
    const file = pendingConfirmImageFile();
    if (file.exists) {
      return {
        ...payload,
        form: { ...payload.form, localImageUri: file.uri },
      };
    }
  }
  return payload;
}

export async function clearPendingConfirm(userId: string): Promise<void> {
  await removeSecureStoreEntry(confirmKey(userId));
  await deletePendingConfirmImageFile();
}

export async function clearAllPendingMeals(userId: string): Promise<void> {
  await clearPendingUpload(userId);
  await clearPendingConfirm(userId);
}
