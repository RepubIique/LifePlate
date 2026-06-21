import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useWidgetQuickAction } from "@/context/WidgetQuickActionContext";

/** Deep link entry for the widget camera quick action. */
export default function WidgetLogCameraScreen() {
  const { queueCameraLog } = useWidgetQuickAction();

  useEffect(() => {
    queueCameraLog();
  }, [queueCameraLog]);

  return <Redirect href="/(tabs)" />;
}
