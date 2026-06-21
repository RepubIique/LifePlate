import test from "node:test";
import assert from "node:assert/strict";
import { shouldSyncSubscriptionFromRevenueCat } from "../dist/routes/subscription.js";

test("shouldSyncSubscriptionFromRevenueCat handles purchase lifecycle events", () => {
  assert.equal(shouldSyncSubscriptionFromRevenueCat("INITIAL_PURCHASE"), true);
  assert.equal(shouldSyncSubscriptionFromRevenueCat("RENEWAL"), true);
  assert.equal(shouldSyncSubscriptionFromRevenueCat("EXPIRATION"), true);
  assert.equal(shouldSyncSubscriptionFromRevenueCat("CANCELLATION"), true);
  assert.equal(shouldSyncSubscriptionFromRevenueCat("BILLING_ISSUE"), true);
});

test("shouldSyncSubscriptionFromRevenueCat ignores unrelated events", () => {
  assert.equal(shouldSyncSubscriptionFromRevenueCat("TEST"), false);
  assert.equal(shouldSyncSubscriptionFromRevenueCat(undefined), false);
});
