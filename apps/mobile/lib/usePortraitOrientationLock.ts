import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

/** Keep the app portrait-only — landscape breaks modals like text log. */
export function usePortraitOrientationLock() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    const lockPortrait = () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };

    lockPortrait();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        lockPortrait();
      }
    });

    return () => sub.remove();
  }, []);
}
