export type RevenueCatEntitlement = {
  expires_date: string | null;
  product_identifier?: string;
};

export type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
  };
};

export function isRevenueCatEntitlementActive(
  entitlements: Record<string, RevenueCatEntitlement> | undefined,
  entitlementId: string,
  now = new Date(),
): boolean {
  const entitlement = entitlements?.[entitlementId];
  if (!entitlement) return false;
  if (entitlement.expires_date == null) return true;
  const expiresAt = new Date(entitlement.expires_date);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt > now;
}

export async function fetchRevenueCatSubscriber(
  appUserId: string,
  secretApiKey: string,
): Promise<RevenueCatSubscriberResponse> {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretApiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RevenueCat API error (${res.status}): ${body || res.statusText}`);
  }

  return res.json() as Promise<RevenueCatSubscriberResponse>;
}

export async function resolvePaidFromRevenueCat(
  appUserId: string,
  secretApiKey: string,
  entitlementId: string,
): Promise<boolean> {
  const payload = await fetchRevenueCatSubscriber(appUserId, secretApiKey);
  return isRevenueCatEntitlementActive(
    payload.subscriber?.entitlements,
    entitlementId,
  );
}
