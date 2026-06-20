import assert from "node:assert/strict";
import test from "node:test";
import { draftHasImage } from "../dist/services/drafts.js";

const baseDraft = {
  id: "draft-1",
  userId: "user-1",
  imageUrl: "",
  analysis: { mealName: "Lunch", foods: [], estimatedCalories: 400 },
  rawAiResponse: {},
  expiresAt: Date.now() + 60_000,
};

test("draftHasImage is false for text-only drafts", () => {
  assert.equal(draftHasImage({ ...baseDraft, imageUrl: "" }), false);
  assert.equal(draftHasImage({ ...baseDraft, imageUrl: "   " }), false);
  assert.equal(draftHasImage({ ...baseDraft, hasImageData: false }), false);
});

test("draftHasImage is true when draft has buffer, URL, or stored image flag", () => {
  assert.equal(
    draftHasImage({ ...baseDraft, imageBuffer: Buffer.from("img") }),
    true,
  );
  assert.equal(
    draftHasImage({
      ...baseDraft,
      imageUrl: "https://example.com/meal.jpg",
    }),
    true,
  );
  assert.equal(
    draftHasImage({ ...baseDraft, hasImageData: true }),
    true,
  );
});
