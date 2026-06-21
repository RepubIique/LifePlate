import * as Linking from "expo-linking";
import { router } from "expo-router";
import { addUserInteractionListener } from "expo-widgets";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useWidgetQuickAction } from "@/context/WidgetQuickActionContext";
import {
  isWidgetLogCameraUrl,
  WIDGET_LOG_CAMERA_TARGET,
} from "@/lib/widgetQuickAction";

function handleWidgetLogCamera(queueCameraLog: () => void) {
  queueCameraLog();
  router.replace("/(tabs)");
}

/** Routes widget button taps and deep links into the home camera flow. */
export function WidgetInteractionHandler() {
  const { queueCameraLog } = useWidgetQuickAction();

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const openFromUrl = (url: string | null) => {
      if (!url || !isWidgetLogCameraUrl(url)) return;
      handleWidgetLogCamera(queueCameraLog);
    };

    void Linking.getInitialURL().then(openFromUrl);

    const linkSub = Linking.addEventListener("url", ({ url }) => {
      openFromUrl(url);
    });

    const widgetSub = addUserInteractionListener((event) => {
      if (event.target !== WIDGET_LOG_CAMERA_TARGET) return;
      handleWidgetLogCamera(queueCameraLog);
    });

    return () => {
      linkSub.remove();
      widgetSub.remove();
    };
  }, [queueCameraLog]);

  return null;
}
