import { MealGuardrailError } from "./mealGuardrails.js";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MIN_BYTES = 1024;
const MIN_DIMENSION = 200;

export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (brand.includes("heic") || brand.includes("heif") || brand.includes("mif1")) {
      return "image/heic";
    }
  }

  return null;
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    if (marker === undefined) return null;

    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      if (offset + 9 > buffer.length) return null;
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }
  return null;
}

function readWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;

  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    if (buffer.length < 30) return null;
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: (buffer[24]! | (buffer[25]! << 8) | (buffer[26]! << 16)) + 1,
      height: (buffer[27]! | (buffer[28]! << 8) | (buffer[29]! << 16)) + 1,
    };
  }

  return null;
}

function readDimensions(
  buffer: Buffer,
  mime: string,
): { width: number; height: number } | null {
  if (mime === "image/png") return readPngDimensions(buffer);
  if (mime === "image/jpeg") return readJpegDimensions(buffer);
  if (mime === "image/webp") return readWebpDimensions(buffer);
  return null;
}

export function validateUploadImage(buffer: Buffer, declaredMime: string): void {
  if (buffer.length < MIN_BYTES) {
    throw new MealGuardrailError(
      "INVALID_IMAGE",
      "Image file is too small or corrupted.",
      400,
    );
  }

  const normalizedMime = declaredMime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_MIMES.has(normalizedMime)) {
    throw new MealGuardrailError(
      "INVALID_IMAGE",
      "Please upload a photo (JPEG, PNG, or WebP).",
      400,
    );
  }

  const sniffed = sniffImageMime(buffer);
  if (!sniffed) {
    throw new MealGuardrailError(
      "INVALID_IMAGE",
      "File does not look like a supported image.",
      400,
    );
  }

  const compatible =
    sniffed === normalizedMime ||
    (sniffed === "image/heic" && (normalizedMime === "image/heic" || normalizedMime === "image/heif")) ||
    (sniffed === "image/jpeg" && normalizedMime === "image/jpeg") ||
    (sniffed === "image/png" && normalizedMime === "image/png") ||
    (sniffed === "image/webp" && normalizedMime === "image/webp");

  if (!compatible) {
    throw new MealGuardrailError(
      "INVALID_IMAGE",
      "Image type does not match the file contents.",
      400,
    );
  }

  const dimensions = readDimensions(buffer, sniffed);
  if (dimensions) {
    const { width, height } = dimensions;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      throw new MealGuardrailError(
        "INVALID_IMAGE",
        "Image is too small. Use a clearer photo of your meal.",
        400,
      );
    }
  }
}
