import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiError,
  hydrationSyncErrorMessage,
  isRetryableError,
  mealFlowErrorMessage,
} from "../apiErrors";

test("isRetryableError treats network and server failures as retryable", () => {
  assert.equal(isRetryableError(new ApiError("Server error", 503)), true);
  assert.equal(isRetryableError(new ApiError("Timeout", 408)), true);
  assert.equal(isRetryableError(new ApiError("Failed to fetch", 0)), true);
  assert.equal(isRetryableError(new ApiError("Not food", 422, "NOT_FOOD")), false);
  assert.equal(isRetryableError(new ApiError("Slow down", 429, "RATE_LIMITED")), false);
});

test("mealFlowErrorMessage customizes retryable upload and confirm errors", () => {
  const networkErr = new ApiError("Failed to fetch", 0);
  assert.match(mealFlowErrorMessage(networkErr, "upload"), /photo is still here/i);
  assert.match(mealFlowErrorMessage(networkErr, "analyze-text"), /tap Retry/i);
  assert.match(mealFlowErrorMessage(networkErr, "confirm"), /still on this screen/i);
  assert.match(
    mealFlowErrorMessage(new ApiError("Not food", 422, "NOT_FOOD"), "upload"),
    /food photos/i,
  );
});

test("hydrationSyncErrorMessage prompts retry", () => {
  assert.match(hydrationSyncErrorMessage(), /sync hydration/i);
  assert.match(hydrationSyncErrorMessage(), /retry/i);
});
