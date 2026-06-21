import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { configureRevenueCat, logInRevenueCat, logOutRevenueCat } from "@/lib/revenueCat";

/** Bind RevenueCat app_user_id to the Supabase user id. */
export function useRevenueCatSession(session: Session | null) {
  useEffect(() => {
    void configureRevenueCat();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      void logOutRevenueCat();
      return;
    }
    void logInRevenueCat(userId);
  }, [session?.user.id]);
}
