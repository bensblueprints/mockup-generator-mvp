/*
 * Mockcraft PNG codec — minimal, dependency-free RGBA PNG encoder (+ header
 * reader for validation). Node-only (uses zlib + Buffer); used by the smoke
 * tests and available for headless/CLI export. The Electron renderer exports
 * via canvas.toDataURL instead.
 */
'use strict';

const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Encode a raster image { width, height, data: Uint8ClampedArray RGBA } to a PNG Buffer. */
function encode(img) {
  const { width, height, data } = img;
  if (!width || !height || data.length !== width * height * 4) {
    throw new Error('encode: image dimensions do not match data length');
  }
  // raw scanlines: 1 filter byte (0 = none) + width*4 RGBA bytes per row
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    const rowStart = y * width * 4;
    for (let i = 0; i < width * 4; i++) raw[o++] = data[rowStart + i];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Read { width, height, bitDepth, colorType } from a PNG Buffer, or throw. */
function readHeader(buf) {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('readHeader: not a PNG (bad signature)');
  }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('readHeader: first chunk is not IHDR');
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
  };
}

/** Decode a (Mockcraft-encoded, filter-0, RGBA) PNG back to a raster image. */
function decode(buf) {
  const h = readHeader(buf);
  if (h.bitDepth !== 8 || h.colorType !== 6) {
    throw new Error('decode: only 8-bit RGBA PNGs are supported');
  }
  // walk chunks, concat IDAT
  const idats = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    if (type === 'IDAT') idats.push(buf.subarray(p + 8, p + 8 + len));
    if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const { width, height } = h;
  const data = new Uint8ClampedArray(width * height * 4);
  const stride = width * 4 + 1;
  for (let y = 0; y < height; y++) {
    if (raw[y * stride] !== 0) throw new Error('decode: only filter type 0 is supported');
    for (let i = 0; i < width * 4; i++) data[y * width * 4 + i] = raw[y * stride + 1 + i];
  }
  return { width, height, data };
}

module.exports = { encode, decode, readHeader, crc32, SIGNATURE };
