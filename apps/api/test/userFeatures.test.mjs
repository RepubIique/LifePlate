import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeMealCloudImageUrl,
  shouldUploadMealToCloud,
} from "../dist/services/userFeatures.js";

test("shouldUploadMealToCloud requires paid plan and backup enabled", () => {
  assert.equal(shouldUploadMealToCloud({ isPaid: true, cloudImageBackup: true }), true);
  assert.equal(shouldUploadMealToCloud({ isPaid: true, cloudImageBackup: false }), false);
  assert.equal(shouldUploadMealToCloud({ isPaid: false, cloudImageBackup: true }), false);
});

test("normalizeMealCloudImageUrl clears inline and corrupt storage URLs", () => {
  assert.equal(normalizeMealCloudImageUrl(""), "");
  assert.equal(normalizeMealCloudImageUrl("data:image/jpeg;base64,abc"), "");
  assert.equal(
    normalizeMealCloudImageUrl(
      "https://example.supabase.co/storage/v1/object/public/meals/data:image/jpeg;base64,abc",
    ),
    "",
  );
  assert.equal(
    normalizeMealCloudImageUrl("https://example.supabase.co/storage/v1/object/public/meals/photo.jpg"),
    "https://example.supabase.co/storage/v1/object/public/meals/photo.jpg",
  );
});
