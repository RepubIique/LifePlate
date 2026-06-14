import assert from "node:assert/strict";
import test from "node:test";
import { isCorruptMealImageUrl } from "../dist/services/mealImageUrl.js";

test("isCorruptMealImageUrl detects inline base64 URLs", () => {
  assert.equal(isCorruptMealImageUrl("data:image/jpeg;base64,abc"), true);
});

test("isCorruptMealImageUrl detects mangled storage URLs", () => {
  assert.equal(
    isCorruptMealImageUrl(
      "https://example.supabase.co/storage/v1/object/public/meals/data:image/jpeg;base64,abc",
    ),
    true,
  );
  assert.equal(
    isCorruptMealImageUrl(
      "https://example.supabase.co/storage/v1/object/public/meals/data%3Aimage/jpeg",
    ),
    true,
  );
});

test("isCorruptMealImageUrl accepts normal storage paths", () => {
  assert.equal(
    isCorruptMealImageUrl("https://example.supabase.co/storage/v1/object/public/meals/photo.jpg"),
    false,
  );
  assert.equal(isCorruptMealImageUrl(null), false);
});
