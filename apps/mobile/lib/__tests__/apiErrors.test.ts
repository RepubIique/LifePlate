import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, friendlyErrorMessage, parseApiError } from "../apiErrors.ts";

test("parseApiError reads JSON message and code", () => {
  const err = parseApiError(
    JSON.stringify({ message: "Rate limited", code: "RATE_LIMITED" }),
    429,
  );
  assert.equal(err.message, "Rate limited");
  assert.equal(err.code, "RATE_LIMITED");
  assert.equal(err.status, 429);
});

test("parseApiError falls back when body is not JSON", () => {
  const err = parseApiError("upstream timeout", 502);
  assert.equal(err.message, "upstream timeout");
  assert.equal(err.status, 502);
});

test("friendlyErrorMessage maps auth and guardrail codes", () => {
  assert.match(
    friendlyErrorMessage(new ApiError("Unauthorized", 401)),
    /sign in again/i,
  );
  assert.match(
    friendlyErrorMessage(new ApiError("Not food", 422, "NOT_FOOD")),
    /food photos/i,
  );
  assert.match(
    friendlyErrorMessage(new ApiError("Too big", 413)),
    /too large/i,
  );
  assert.match(
    friendlyErrorMessage(new ApiError("Slow down", 429, "RATE_LIMITED")),
    /slow down/i,
  );
});

test("friendlyErrorMessage returns generic Error message", () => {
  assert.equal(friendlyErrorMessage(new Error("Network down")), "Network down");
});
