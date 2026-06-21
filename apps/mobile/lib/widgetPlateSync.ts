import { Platform } from "react-native";
import type { DigitalPlateWidgetProps } from "@lifeplate/shared";

export function syncDigitalPlateWidget(props: DigitalPlateWidgetProps): void {
  if (Platform.OS !== "ios") return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const widget = require("@/widgets/DigitalPlateWidget").default as {
      updateSnapshot: (next: DigitalPlateWidgetProps) => void;
    };
    widget.updateSnapshot(props);
  } catch {
    // Widget extension unavailable in Expo Go or unsupported builds.
  }
}
