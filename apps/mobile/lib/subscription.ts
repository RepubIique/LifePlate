import { Alert, Platform } from "react-native";
import type { UserProfile } from "@lifeplate/shared";
import { syncSubscription } from "./api";
import { isRevenueCatEnabled } from "./revenueCatConfig";
import {
  hasPlusEntitlement,
  purchaseRevenueCatPlus,
  restoreRevenueCatPurchases,
} from "./revenueCat";

export type PurchasePlusResult =
  | "success"
  | "cancelled"
  | "unavailable"
  | "sync_failed";

function showSubscriptionsUnavailableAlert(): Promise<"unavailable"> {
  return new Promise((resolve) => {
    Alert.alert(
      "Subscriptions coming soon",
      Platform.select({
        ios: "LifePlate Plus will be available through the App Store in an upcoming release.",
        android: "LifePlate Plus will be available through Google Play in an upcoming release.",
        default: "LifePlate Plus subscriptions are not available in this build yet.",
      }),
      [{ text: "OK", onPress: () => resolve("unavailable") }],
    );
  });
}

export function showPlusSyncFailedAlert(): void {
  Alert.alert(
    "Almost there",
    "Your purchase went through, but we couldn't activate Plus on your account yet. Try Restore purchases, or wait a moment and open Profile to refresh.",
  );
}

async function syncEntitlementToServer(): Promise<"synced" | "failed"> {
  try {
    await syncSubscription();
    return "synced";
  } catch {
    return "failed";
  }
}

export async function purchasePlus(): Promise<PurchasePlusResult> {
  if (!isRevenueCatEnabled()) {
    return showSubscriptionsUnavailableAlert();
  }

  const result = await purchaseRevenueCatPlus();
  if (result !== "success") return result;

  const sync = await syncEntitlementToServer();
  return sync === "synced" ? "success" : "sync_failed";
}

/** Restore Store purchases and sync entitlement to the LifePlate API. */
export async function restorePurchases(
  refreshProfile: () => Promise<UserProfile | null>,
): Promise<{ profile: UserProfile | null; syncFailed: boolean }> {
  let syncFailed = false;

  if (isRevenueCatEnabled()) {
    const customerInfo = await restoreRevenueCatPurchases();
    if (customerInfo && hasPlusEntitlement(customerInfo)) {
      syncFailed = (await syncEntitlementToServer()) === "failed";
    }
  }

  const profile = await refreshProfile();
  return { profile, syncFailed };
}
