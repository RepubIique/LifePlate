import test from "node:test";
import assert from "node:assert/strict";
import {
  shouldUploadMealToCloud,
} from "../dist/services/userFeatures.js";

test("shouldUploadMealToCloud requires LifePlate Plus", () => {
  assert.equal(shouldUploadMealToCloud({ isPaid: true }), true);
  assert.equal(shouldUploadMealToCloud({ isPaid: false }), false);
});
