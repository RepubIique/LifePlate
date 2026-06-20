import assert from "node:assert/strict";
import { palette, semantic, tints, ui } from "@/src/theme/lifeplate";
import test from "node:test";
import { hexWithAlpha } from "@/lib/nutritionIcons";

test("hexWithAlpha appends alpha channel to 6-digit hex colors", () => {
  assert.equal(hexWithAlpha(semantic.primary, 0.12), "#3E56411f");
  assert.equal(hexWithAlpha(semantic.primary, 1), "#3E5641ff");
  assert.equal(hexWithAlpha(semantic.primary, 0), "#3E564100");
});

test("hexWithAlpha returns the original value for invalid hex lengths", () => {
  assert.equal(hexWithAlpha("#fff", 0.5), "#fff");
  assert.equal(hexWithAlpha("40916", 0.5), "40916");
});
