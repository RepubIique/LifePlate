/** Minimal valid image buffers for upload validation tests. */

export function makeJpegBuffer(width = 300, height = 300) {
  const buf = Buffer.alloc(2048, 0xff);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xff;
  buf[4] = 0xe0;
  buf.writeUInt16BE(16, 5);

  const sof = 20;
  buf[sof] = 0xff;
  buf[sof + 1] = 0xc0;
  buf.writeUInt16BE(17, sof + 2);
  buf.writeUInt16BE(height, sof + 5);
  buf.writeUInt16BE(width, sof + 7);
  return buf;
}

export function makePngBuffer(width = 300, height = 300) {
  const buf = Buffer.alloc(2048);
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4e;
  buf[3] = 0x47;
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

export function makeHeicBuffer() {
  const buf = Buffer.alloc(2048);
  buf.write("ftyp", 4, "ascii");
  buf.write("heic", 8, "ascii");
  return buf;
}
