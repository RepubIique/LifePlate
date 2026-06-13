import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "./supabase";

/** Deep link Supabase should use for email confirm / OAuth return. */
export const AUTH_REDIRECT_URI = makeRedirectUri({
  scheme: "lifeplate",
  path: "auth/callback",
});

export async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: String(params.access_token),
      refresh_token: String(params.refresh_token),
    });
    if (error) throw error;
    return;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(String(params.code));
    if (error) throw error;
    return;
  }

  throw new Error("No auth credentials found in redirect URL");
}
