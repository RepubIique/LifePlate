import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import type { UserProfile } from "@lifeplate/shared";
import { router } from "expo-router";
import { fetchProfile } from "@/lib/api";
import { AUTH_REDIRECT_URI } from "@/lib/authRedirect";
import { setUnauthorizedHandler } from "@/lib/sessionEvents";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  patchProfile: (patch: Partial<UserProfile>) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: "apple" | "google") => Promise<void>;
  linkProvider: (provider: "apple" | "google") => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileFetchSeq = useRef(0);

  const patchProfile = useCallback((patch: Partial<UserProfile>) => {
    profileFetchSeq.current += 1;
    setProfile((prev) => {
      if (prev) return { ...prev, ...patch };
      if (!session) return prev;
      return {
        id: session.user.id,
        email: session.user.email ?? "",
        name: null,
        goal: null,
        weightKg: null,
        heightCm: null,
        age: null,
        gender: null,
        nutritionTargets: null,
        mealsLogged: 0,
        currentStreak: 0,
        longestStreak: 0,
        ...patch,
      };
    });
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    const fetchId = ++profileFetchSeq.current;
    setProfileLoading(true);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const p = await fetchProfile();
        if (fetchId !== profileFetchSeq.current) return;
        setProfile(p);
        setProfileLoading(false);
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
    }
    if (fetchId !== profileFetchSeq.current) return;
    // Keep the last known profile to avoid re-prompting onboarding on transient errors.
    setProfileLoading(false);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await supabase.auth.signOut();
      setProfile(null);
      router.replace("/(auth)/welcome");
    });

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // Stale or revoked refresh token — clear local session and send to sign-in.
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        return;
      }
      setSession(next);
    });

    return () => {
      sub.subscription.unsubscribe();
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    if (session) {
      refreshProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [session, refreshProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: AUTH_REDIRECT_URI },
    });
    if (error) throw error;
  }, []);

  const signInWithProvider = useCallback(async (provider: "apple" | "google") => {
    const redirectTo = AUTH_REDIRECT_URI;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }
  }, []);

  const linkProvider = useCallback(async (provider: "apple" | "google") => {
    const redirectTo = AUTH_REDIRECT_URI;
    // linkIdentity is the supported “connect provider to existing user” flow in supabase-js v2
    // (works similarly to signInWithOAuth, but links instead of creating a new user).
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No OAuth URL returned");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      refreshProfile,
      patchProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithProvider,
      linkProvider,
      signOut,
    }),
    [
      session,
      profile,
      loading,
      profileLoading,
      refreshProfile,
      patchProfile,
      signInWithEmail,
      signUpWithEmail,
      signInWithProvider,
      linkProvider,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
