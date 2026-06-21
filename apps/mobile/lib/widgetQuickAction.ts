export {
  WIDGET_LOG_CAMERA_TARGET,
  WIDGET_LOG_CAMERA_URL,
} from "@lifeplate/shared";

export function isWidgetLogCameraUrl(url: string): boolean {
  return url.includes("/log/camera");
}
