import test from "node:test";
import assert from "node:assert/strict";
import { isRevenueCatEntitlementActive } from "../dist/services/revenueCat.js";

test("isRevenueCatEntitlementActive treats null expires_date as active", () => {
  assert.equal(
    isRevenueCatEntitlementActive({ plus: { expires_date: null } }, "plus"),
    true,
  );
});

test("isRevenueCatEntitlementActive rejects expired entitlements", () => {
  assert.equal(
    isRevenueCatEntitlementActive(
      { plus: { expires_date: "2020-01-01T00:00:00Z" } },
      "plus",
      new Date("2026-01-01T00:00:00Z"),
    ),
    false,
  );
});

test("isRevenueCatEntitlementActive accepts future expiry", () => {
  assert.equal(
    isRevenueCatEntitlementActive(
      { plus: { expires_date: "2030-01-01T00:00:00Z" } },
      "plus",
      new Date("2026-01-01T00:00:00Z"),
    ),
    true,
  );
});
