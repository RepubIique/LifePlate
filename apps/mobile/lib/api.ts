import type {
  AlphaFeedbackMessage,
  InsightsResponse,
  MealConfirmRequest,
  MealListItem,
  MealListSummary,
  MealDetail,
  MealPhotoAttachResponse,
  MealRefineResponse,
  MealReanalyzeRequest,
  MealReanalyzeResponse,
  MealUploadResponse,
  MealUpdateRequest,
  MealReorderRequest,
  NutritionDashboardApiResponse,
  ProfileAvatarResponse,
  ProfilePatchResponse,
  UserProfile,
  HydrationHistoryResponse,
  Gender,
} from "@lifeplate/shared";
import { File, UploadType } from "expo-file-system";
import { supabase } from "./supabase";
import { Platform } from "react-native";
import { ApiError, parseApiError } from "./apiErrors";
import { notifyUnauthorized } from "./sessionEvents";
import { getApiUrl } from "./env";

const API_URL = getApiUrl();
const REQUEST_TIMEOUT_MS = 30_000;

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError("Not authenticated", 401);
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    const err = parseApiError(body, res.status);
    if (err.status === 401) notifyUnauthorized();
    throw err;
  }
  return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await authHeaders();
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(base)) {
    headers.set(k, v);
  }

  const hasBody = init?.body !== undefined && init?.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    return handleResponse<T>(res);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProfile(): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me");
}

export async function fetchProfileAvatar(): Promise<ProfileAvatarResponse> {
  return request<ProfileAvatarResponse>("/api/users/me/avatar");
}

export async function updateProfile(body: {
  goal?: string;
  name?: string;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: Gender | null;
  cloudImageBackup?: boolean;
}): Promise<ProfilePatchResponse> {
  return request<ProfilePatchResponse>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadProfileAvatar(input: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<{ avatarUrl: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    notifyUnauthorized();
    throw new ApiError("Not authenticated", 401);
  }

  const mimeType = input.mimeType ?? "image/jpeg";
  const fileName = input.fileName ?? "avatar.jpg";

  if (Platform.OS === "web") {
    const form = new FormData();
    const blob = await (await fetch(input.uri)).blob();
    form.append("file", blob, fileName);

    const res = await fetch(`${API_URL}/api/users/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    return handleResponse<{ avatarUrl: string }>(res);
  }

  const file = new File(input.uri);
  const result = await file.upload(`${API_URL}/api/users/me/avatar`, {
    uploadType: UploadType.MULTIPART,
    fieldName: "file",
    mimeType,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    const err = parseApiError(result.body, result.status);
    if (err.status === 401) notifyUnauthorized();
    throw err;
  }

  return JSON.parse(result.body) as { avatarUrl: string };
}

export async function updateGoal(goal: string): Promise<ProfilePatchResponse> {
  return updateProfile({ goal });
}

export async function fetchMeals(): Promise<MealListSummary[]> {
  const data = await request<{ meals: MealListSummary[] }>("/api/meals");
  return data.meals;
}

export async function fetchMealsFull(): Promise<MealListItem[]> {
  const data = await request<{ meals: MealListItem[] }>("/api/meals?view=full");
  return data.meals;
}

export async function fetchMeal(id: string): Promise<MealDetail> {
  return request<MealDetail>(`/api/meals/${id}`);
}

/** Plus fallback — resolve a cloud-backed meal photo from the database. */
export async function fetchMealImageUrl(
  mealId: string,
): Promise<{ imageUrl: string | null }> {
  return request<{ imageUrl: string | null }>(`/api/meals/${mealId}/image`);
}

export async function updateMeal(id: string, body: MealUpdateRequest): Promise<void> {
  await request(`/api/meals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function reorderMeals(body: MealReorderRequest): Promise<void> {
  await request("/api/meals/reorder", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteMeal(id: string): Promise<void> {
  await request(`/api/meals/${id}`, { method: "DELETE" });
}

export async function fetchInsights(): Promise<InsightsResponse> {
  return request<InsightsResponse>("/api/insights");
}

export async function fetchNutritionDashboard(
  date?: string,
): Promise<NutritionDashboardApiResponse> {
  const query = date?.trim() ? `?date=${encodeURIComponent(date)}` : "";
  return request<NutritionDashboardApiResponse>(`/api/nutrition/dashboard${query}`);
}

export async function updateHydration(
  glasses: number,
  date?: string,
): Promise<{ glasses: number; date: string }> {
  return request<{ glasses: number; date: string }>("/api/nutrition/hydration", {
    method: "PATCH",
    body: JSON.stringify({ glasses, date }),
  });
}

export async function fetchHydrationHistory(days = 60): Promise<HydrationHistoryResponse> {
  return request<HydrationHistoryResponse>(`/api/nutrition/hydration?days=${days}`);
}

export async function analyzeMealText(description: string): Promise<MealUploadResponse> {
  return request<MealUploadResponse>("/api/meals/log-text", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function uploadMealImage(input: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<MealUploadResponse> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    notifyUnauthorized();
    throw new ApiError("Not authenticated", 401);
  }

  const mimeType = input.mimeType ?? "image/jpeg";
  const fileName = input.fileName ?? (mimeType.includes("png") ? "meal.png" : "meal.jpg");

  if (Platform.OS === "web") {
    const form = new FormData();
    const blob = await (await fetch(input.uri)).blob();
    form.append("file", blob, fileName);

    const res = await fetch(`${API_URL}/api/meals/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    return handleResponse<MealUploadResponse>(res);
  }

  const file = new File(input.uri);
  const result = await file.upload(`${API_URL}/api/meals/upload`, {
    uploadType: UploadType.MULTIPART,
    fieldName: "file",
    mimeType,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    const err = parseApiError(result.body, result.status);
    if (err.status === 401) notifyUnauthorized();
    throw err;
  }

  return JSON.parse(result.body) as MealUploadResponse;
}

async function uploadMealPhotoMultipart<T>(
  path: string,
  input: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
  },
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    notifyUnauthorized();
    throw new ApiError("Not authenticated", 401);
  }

  const mimeType = input.mimeType ?? "image/jpeg";
  const fileName = input.fileName ?? (mimeType.includes("png") ? "meal.png" : "meal.jpg");

  if (Platform.OS === "web") {
    const form = new FormData();
    const blob = await (await fetch(input.uri)).blob();
    form.append("file", blob, fileName);

    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    return handleResponse<T>(res);
  }

  const file = new File(input.uri);
  const result = await file.upload(`${API_URL}${path}`, {
    uploadType: UploadType.MULTIPART,
    fieldName: "file",
    mimeType,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    const err = parseApiError(result.body, result.status);
    if (err.status === 401) notifyUnauthorized();
    throw err;
  }

  return JSON.parse(result.body) as T;
}

export async function attachDraftPhoto(
  draftId: string,
  input: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
  },
): Promise<MealPhotoAttachResponse> {
  return uploadMealPhotoMultipart<MealPhotoAttachResponse>(
    `/api/meals/drafts/${draftId}/photo`,
    input,
  );
}

export async function attachMealPhoto(
  mealId: string,
  input: {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
  },
): Promise<MealPhotoAttachResponse> {
  return uploadMealPhotoMultipart<MealPhotoAttachResponse>(
    `/api/meals/${mealId}/photo`,
    input,
  );
}

export async function confirmMeal(body: MealConfirmRequest): Promise<{ id: string }> {
  const cloudUrl = body.imageUrl?.trim() ?? "";
  const payload = {
    ...body,
    imageUrl: cloudUrl.startsWith("http") ? cloudUrl : undefined,
  };
  return request<{ id: string }>("/api/meals/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refineMeal(
  draftId: string,
  clarification: string,
): Promise<MealRefineResponse> {
  return request<MealRefineResponse>("/api/meals/refine", {
    method: "POST",
    body: JSON.stringify({ draftId, clarification }),
  });
}

export async function reanalyzeMeal(
  id: string,
  body: MealReanalyzeRequest,
): Promise<MealReanalyzeResponse> {
  return request<MealReanalyzeResponse>(`/api/meals/${id}/reanalyze`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAlphaFeedbackMessages(): Promise<AlphaFeedbackMessage[]> {
  const data = await request<{ messages: AlphaFeedbackMessage[] }>("/api/feedback/messages");
  return data.messages;
}

export async function sendAlphaFeedbackMessage(message: string): Promise<AlphaFeedbackMessage> {
  return request<AlphaFeedbackMessage>("/api/feedback/messages", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
