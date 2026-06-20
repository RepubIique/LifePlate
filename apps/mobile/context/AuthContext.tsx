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
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  clearCachedProfile,
  loadCachedProfile,
  isProfileEntitlementsStale,
  saveCachedProfile,
} from "@/lib/profileCache";
import { clearCachedAvatar } from "@/lib/avatarCache";
import { clearCachedMeals } from "@/lib/mealsCache";
import { clearCachedDashboard } from "@/lib/dashboardCache";
import { clearCachedDayDashboards } from "@/lib/dayDashboardCache";
import { clearCachedHydration } from "@/lib/hydrationCache";
import { clearCachedWeekInsights } from "@/lib/weekInsightsCache";
import { clearCachedFriends } from "@/lib/friendsCache";
import { clearCachedGamification } from "@/lib/gamificationCache";
import { clearSeenMilestones } from "@/lib/milestonePrefs";
import { setUnauthorizedHandler } from "@/lib/sessionEvents";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type LoadOptions = {
  force?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  loadProfile: (options?: LoadOptions) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<UserProfile | null>;
  invalidateProfile: () => void;
  patchProfile: (patch: Partial<UserProfile>) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: "apple" | "google") => Promise<boolean>;
  linkProvider: (provider: "apple" | "google") => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileFetchSeq = useRef(0);
  const profileRef = useRef<UserProfile | null>(null);
  const profileFetchedAtRef = useRef(0);
  const profileDirtyRef = useRef(false);
  const profileInflightRef = useRef<Promise<UserProfile | null> | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const patchProfile = useCallback((patch: Partial<UserProfile>) => {
    profileFetchSeq.current += 1;
    setProfile((prev) => {
      let next: UserProfile | null = null;
      if (prev) {
        next = { ...prev, ...patch };
      } else if (session) {
        next = {
          id: session.user.id,
          email: session.user.email ?? "",
          name: null,
          goal: null,
          hasAvatar: false,
          weightKg: null,
          heightCm: null,
          age: null,
          gender: null,
          nutritionTargets: null,
          mealsLogged: 0,
          currentStreak: 0,
          longestStreak: 0,
          isPaid: false,
          cloudImageBackup: false,
          ...patch,
        };
      }
      if (next) {
        void saveCachedProfile(next, profileFetchedAtRef.current || Date.now());
        profileFetchedAtRef.current = Date.now();
        profileDirtyRef.current = false;
      }
      return next ?? prev;
    });
  }, [session]);

  const invalidateProfile = useCallback(() => {
    profileDirtyRef.current = true;
    profileFetchedAtRef.current = 0;
  }, []);

  const fetchProfileFromApi = useCallback(async (): Promise<UserProfile | null> => {
    if (!session) {
      setProfile(null);
      return null;
    }
    const fetchId = ++profileFetchSeq.current;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const p = await fetchProfile();
        if (fetchId !== profileFetchSeq.current) return null;
        setProfile(p);
        void saveCachedProfile(p, Date.now());
        profileFetchedAtRef.current = Date.now();
        profileDirtyRef.current = false;
        return p;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
    }
    if (fetchId !== profileFetchSeq.current) return null;
    return profileRef.current;
  }, [session]);

  const loadProfile = useCallback(
    async (options?: LoadOptions): Promise<UserProfile | null> => {
      if (!session) {
        setProfile(null);
        return null;
      }

      const force = options?.force ?? false;
      const hasData = profileRef.current != null;
      const isFresh =
        !profileDirtyRef.current &&
        hasData &&
        profileFetchedAtRef.current > 0 &&
        Date.now() - profileFetchedAtRef.current < TAB_FOCUS_STALE_MS;

      if (!force && isFresh) return profileRef.current;

      if (profileInflightRef.current) {
        return profileInflightRef.current;
      }

      const run = (async () => {
        if (!hasData) setProfileLoading(true);
        try {
          return await fetchProfileFromApi();
        } finally {
          setProfileLoading(false);
        }
      })();

      profileInflightRef.current = run;
      try {
        return await run;
      } finally {
        if (profileInflightRef.current === run) {
          profileInflightRef.current = null;
        }
      }
    },
    [session, fetchProfileFromApi],
  );

  const refreshProfile = useCallback(
    () => loadProfile({ force: true }),
    [loadProfile],
  );

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
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      profileFetchedAtRef.current = 0;
      profileDirtyRef.current = false;
      profileInflightRef.current = null;
      return;
    }

    let cancelled = false;
    void (async () => {
      const cached = await loadCachedProfile(session.user.id);
      if (!cancelled && cached && !isProfileEntitlementsStale(cached.profile)) {
        setProfile(cached.profile);
        profileRef.current = cached.profile;
        profileFetchedAtRef.current = cached.fetchedAt;
      }
      await loadProfile();
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loadProfile]);

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
      return true;
    }
    return false;
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
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.user.id;
    await supabase.auth.signOut();
    setProfile(null);
    profileFetchedAtRef.current = 0;
    profileDirtyRef.current = false;
    profileInflightRef.current = null;
    if (userId) {
      void clearCachedProfile(userId);
      void clearCachedAvatar(userId);
      void clearCachedMeals(userId);
      void clearCachedDashboard(userId);
      void clearCachedDayDashboards(userId);
      void clearCachedHydration(userId);
      void clearCachedWeekInsights(userId);
      void clearCachedFriends(userId);
      void clearCachedGamification(userId);
      void clearSeenMilestones(userId);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      loadProfile,
      refreshProfile,
      invalidateProfile,
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
      loadProfile,
      refreshProfile,
      invalidateProfile,
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
