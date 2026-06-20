import assert from "node:assert/strict";
import test from "node:test";
import {
  requestLogLevel,
  shouldLogRequest,
} from "../dist/logger.js";

test("shouldLogRequest skips health checks and OPTIONS", () => {
  assert.equal(shouldLogRequest("/health", "GET"), false);
  assert.equal(shouldLogRequest("/api/meals", "OPTIONS"), false);
});

test("shouldLogRequest logs normal API traffic", () => {
  assert.equal(shouldLogRequest("/api/meals", "GET"), true);
  assert.equal(shouldLogRequest("/api/meals?view=summary", "GET"), true);
  assert.equal(shouldLogRequest("/api/meals/reorder", "POST"), true);
});

test("requestLogLevel only returns levels for failed responses", () => {
  assert.equal(requestLogLevel(200), null);
  assert.equal(requestLogLevel(201), null);
  assert.equal(requestLogLevel(304), null);
  assert.equal(requestLogLevel(399), null);
  assert.equal(requestLogLevel(400), "warn");
  assert.equal(requestLogLevel(404), "warn");
  assert.equal(requestLogLevel(499), "warn");
  assert.equal(requestLogLevel(500), "error");
  assert.equal(requestLogLevel(503), "error");
});
