import assert from "node:assert/strict";
import test from "node:test";
import { hexWithAlpha } from "@/lib/nutritionIcons";

test("hexWithAlpha appends alpha channel to 6-digit hex colors", () => {
  assert.equal(hexWithAlpha("#40916C", 0.12), "#40916C1f");
  assert.equal(hexWithAlpha("#40916C", 1), "#40916Cff");
  assert.equal(hexWithAlpha("#40916C", 0), "#40916C00");
});

test("hexWithAlpha returns the original value for invalid hex lengths", () => {
  assert.equal(hexWithAlpha("#fff", 0.5), "#fff");
  assert.equal(hexWithAlpha("40916", 0.5), "40916");
});
