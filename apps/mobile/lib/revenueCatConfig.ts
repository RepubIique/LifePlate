import { Platform } from "react-native";

/** RevenueCat entitlement identifier — must match dashboard + webhook. */
export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "plus";

function revenueCatApiKeyForPlatform(): string {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? "";
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? "";
  }
  return "";
}

/** Gate real IAP — set EXPO_PUBLIC_REVENUECAT_ENABLED=true when keys are configured. */
export function isRevenueCatEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_REVENUECAT_ENABLED !== "true") return false;
  if (Platform.OS === "web") return false;
  return revenueCatApiKeyForPlatform().length > 0;
}

export function getRevenueCatApiKey(): string {
  return revenueCatApiKeyForPlatform();
}
