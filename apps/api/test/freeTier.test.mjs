import test from "node:test";
import assert from "node:assert/strict";
import { FreeTierError, assertCanLogMeals } from "../dist/services/freeTier.js";

test("FreeTierError uses LOGGING_LOCKED code", () => {
  const err = new FreeTierError();
  assert.equal(err.code, "LOGGING_LOCKED");
  assert.equal(err.status, 403);
});

test("assertCanLogMeals is exported", () => {
  assert.equal(typeof assertCanLogMeals, "function");
});
