import assert from "node:assert/strict";
import test from "node:test";
import { MealGuardrailError } from "../dist/services/mealGuardrails.js";
import { sniffImageMime, validateUploadImage } from "../dist/services/imageValidation.js";
import { makeHeicBuffer, makeJpegBuffer, makePngBuffer } from "./fixtures/images.mjs";

test("sniffImageMime detects supported formats", () => {
  assert.equal(sniffImageMime(makeJpegBuffer()), "image/jpeg");
  assert.equal(sniffImageMime(makePngBuffer()), "image/png");
  assert.equal(sniffImageMime(makeHeicBuffer()), "image/heic");
  assert.equal(sniffImageMime(Buffer.alloc(8)), null);
});

test("validateUploadImage accepts matching JPEG buffer", () => {
  assert.doesNotThrow(() => validateUploadImage(makeJpegBuffer(), "image/jpeg"));
});

test("validateUploadImage rejects declared MIME that does not match bytes", () => {
  assert.throws(
    () => validateUploadImage(makeJpegBuffer(), "image/png"),
    (err) => err instanceof MealGuardrailError && err.code === "INVALID_IMAGE",
  );
});

test("validateUploadImage rejects tiny files", () => {
  const tiny = Buffer.alloc(32);
  tiny[0] = 0xff;
  tiny[1] = 0xd8;
  tiny[2] = 0xff;
  assert.throws(
    () => validateUploadImage(tiny, "image/jpeg"),
    (err) => err instanceof MealGuardrailError && err.message.includes("too small"),
  );
});

test("validateUploadImage rejects unsupported declared MIME", () => {
  assert.throws(
    () => validateUploadImage(makeJpegBuffer(), "image/gif"),
    (err) => err instanceof MealGuardrailError && err.code === "INVALID_IMAGE",
  );
});

test("validateUploadImage rejects images below minimum dimensions", () => {
  assert.throws(
    () => validateUploadImage(makePngBuffer(100, 100), "image/png"),
    (err) => err instanceof MealGuardrailError && err.message.includes("too small"),
  );
});
