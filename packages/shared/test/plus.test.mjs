import test from "node:test";
import assert from "node:assert/strict";

test("PLUS_FEATURES includes logging and cloud backup", async () => {
  const { PLUS_FEATURES, plusFeatureById } = await import("@lifeplate/shared");

  assert.equal(PLUS_FEATURES.length, 4);
  assert.ok(plusFeatureById("unlimited_logging"));
  assert.ok(plusFeatureById("cloud_backup"));
  assert.ok(plusFeatureById("digital_plate_widget"));
  assert.ok(plusFeatureById("pdf_export"));
});
