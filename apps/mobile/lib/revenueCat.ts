import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";
import {
  getRevenueCatApiKey,
  isRevenueCatEnabled,
  REVENUECAT_ENTITLEMENT_ID,
} from "./revenueCatConfig";

let configured = false;

export function hasPlusEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
}

function pickPlusPackage(
  packages: PurchasesPackage[] | undefined,
): PurchasesPackage | null {
  if (!packages?.length) return null;
  const monthly = packages.find((pkg) => pkg.packageType === "MONTHLY");
  return monthly ?? packages[0] ?? null;
}

function isUserCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export async function configureRevenueCat(): Promise<void> {
  if (!isRevenueCatEnabled() || configured) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
  configured = true;
}

export async function logInRevenueCat(appUserId: string): Promise<void> {
  if (!isRevenueCatEnabled()) return;
  await configureRevenueCat();
  await Purchases.logIn(appUserId);
}

export async function logOutRevenueCat(): Promise<void> {
  if (!isRevenueCatEnabled() || !configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Anonymous user after logout — safe to ignore.
  }
}

export async function purchaseRevenueCatPlus(): Promise<"success" | "cancelled" | "unavailable"> {
  if (!isRevenueCatEnabled()) return "unavailable";

  await configureRevenueCat();

  const offerings = await Purchases.getOfferings();
  const pkg = pickPlusPackage(offerings.current?.availablePackages);
  if (!pkg) return "unavailable";

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPlusEntitlement(customerInfo) ? "success" : "unavailable";
  } catch (error) {
    if (isUserCancelled(error)) return "cancelled";
    throw error;
  }
}

export async function restoreRevenueCatPurchases(): Promise<CustomerInfo | null> {
  if (!isRevenueCatEnabled()) return null;
  await configureRevenueCat();
  return Purchases.restorePurchases();
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatEnabled()) return null;
  await configureRevenueCat();
  return Purchases.getCustomerInfo();
}

/** Dev-only helper for paywall diagnostics. */
export function revenueCatStatusLabel(): string {
  if (Platform.OS === "web") return "web";
  if (!isRevenueCatEnabled()) return "disabled";
  return "enabled";
}
