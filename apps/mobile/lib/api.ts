import type {
  InsightsResponse,
  MealConfirmRequest,
  MealListItem,
  MealDetail,
  MealRefineResponse,
  MealUploadResponse,
  MealUpdateRequest,
  UserProfile,
} from "@lifeplate/shared";
import { File, UploadType } from "expo-file-system";
import { supabase } from "./supabase";
import { Platform } from "react-native";
import { ApiError, parseApiError } from "./apiErrors";
import { notifyUnauthorized } from "./sessionEvents";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

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

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  return handleResponse<T>(res);
}

export async function fetchProfile(): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me");
}

export async function updateProfile(body: {
  goal?: string;
  name?: string;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
}): Promise<void> {
  await request("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function updateGoal(goal: string): Promise<void> {
  await updateProfile({ goal });
}

export async function fetchMeals(): Promise<MealListItem[]> {
  const data = await request<{ meals: MealListItem[] }>("/api/meals");
  return data.meals;
}

export async function fetchMeal(id: string): Promise<MealDetail> {
  return request<MealDetail>(`/api/meals/${id}`);
}

export async function updateMeal(id: string, body: MealUpdateRequest): Promise<void> {
  await request(`/api/meals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteMeal(id: string): Promise<void> {
  await request(`/api/meals/${id}`, { method: "DELETE" });
}

export async function fetchInsights(): Promise<InsightsResponse> {
  return request<InsightsResponse>("/api/insights");
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

export async function confirmMeal(body: MealConfirmRequest): Promise<void> {
  await request("/api/meals/confirm", {
    method: "POST",
    body: JSON.stringify(body),
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
