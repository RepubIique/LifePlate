import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { setUserPaidStatus } from "../services/subscription.js";
import { resolvePaidFromRevenueCat } from "../services/revenueCat.js";

type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "PRODUCT_CHANGE"
  | "EXPIRATION"
  | "CANCELLATION"
  | "BILLING_ISSUE"
  | string;

type RevenueCatWebhookBody = {
  event?: {
    type?: RevenueCatEventType;
    app_user_id?: string;
    entitlement_ids?: string[] | null;
  };
};

/** Events that should refresh is_paid from the RevenueCat subscriber API. */
const SYNC_EVENTS = new Set<RevenueCatEventType>([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "EXPIRATION",
  "CANCELLATION",
  "BILLING_ISSUE",
]);

export function shouldSyncSubscriptionFromRevenueCat(
  eventType: RevenueCatEventType | undefined,
): boolean {
  return eventType != null && SYNC_EVENTS.has(eventType);
}

function isAuthorizedWebhook(authHeader: string | undefined): boolean {
  const secret = config.revenuecatWebhookSecret.trim();
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function subscriptionRoutes(app: FastifyInstance) {
  app.post("/api/subscription/sync", { preHandler: requireAuth }, async (request, reply) => {
    const { userId, userEmail } = request as AuthedRequest;
    const secret = config.revenuecatSecretApiKey.trim();
    if (!secret) {
      return reply.code(503).send({
        error: "RevenueCat sync is not configured on the server.",
        code: "REVENUECAT_NOT_CONFIGURED",
      });
    }

    const isPaid = await resolvePaidFromRevenueCat(
      userId,
      secret,
      config.revenuecatEntitlementId,
    );
    await setUserPaidStatus(userId, isPaid, userEmail);
    return { isPaid };
  });

  app.post<{ Body: RevenueCatWebhookBody }>(
    "/api/subscription/revenuecat-webhook",
    async (request, reply) => {
      if (!isAuthorizedWebhook(request.headers.authorization)) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const event = request.body?.event;
      const userId = event?.app_user_id?.trim();
      if (!userId) {
        return reply.code(400).send({ error: "Missing app_user_id" });
      }

      if (!shouldSyncSubscriptionFromRevenueCat(event?.type)) {
        return { ok: true, ignored: true, type: event?.type ?? "unknown" };
      }

      const secret = config.revenuecatSecretApiKey.trim();
      if (!secret) {
        return reply.code(503).send({
          error: "RevenueCat sync is not configured on the server.",
          code: "REVENUECAT_NOT_CONFIGURED",
        });
      }

      const isPaid = await resolvePaidFromRevenueCat(
        userId,
        secret,
        config.revenuecatEntitlementId,
      );
      await setUserPaidStatus(userId, isPaid);
      return { ok: true, userId, isPaid, type: event?.type ?? "unknown" };
    },
  );
}
