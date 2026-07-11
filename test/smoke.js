'use strict';

/**
 * Mockcraft smoke test — pure Node, no Electron, no Canvas.
 *   1. Raster engine: alpha blending, shape fills, gradients.
 *   2. Homography: unit-square -> quad mapping and its inverse (perspective warp).
 *   3. Warp semantics: cover/contain/stretch fits, offsets, multiply-under shading.
 *   4. Template pack: every bundled template renders a real design end-to-end.
 *   5. Garment color variants actually change apparel pixels.
 *   6. Batch export: renders every template to a real PNG file on disk and
 *      validates each one (signature, IHDR dimensions, decode round-trip).
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const R = require('../src/core/raster');
const T = require('../src/core/templates');
const PNG = require('../src/core/png');

let passed = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  passed++;
  console.log('  ✔ ' + msg);
}
function eq(actual, expected, msg) {
  assert.strictEqual(actual, expected, `${msg} (expected ${expected}, got ${actual})`);
  passed++;
  console.log('  ✔ ' + msg);
}
function approx(actual, expected, tol, msg) {
  assert.ok(Math.abs(actual - expected) <= tol, `${msg} (expected ~${expected}±${tol}, got ${actual})`);
  passed++;
  console.log('  ✔ ' + msg);
}

function pixel(img, x, y) {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

/** Generate a deterministic test "design": red/blue quadrant checker with a green center dot. */
function makeDesign(w, h) {
  const img = R.createImage(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const left = x < w / 2, top = y < h / 2;
      const c = (left === top) ? [220, 40, 40] : [40, 60, 220];
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
  }
  R.fillEllipse(img, w / 2, h / 2, w / 10, h / 10, [40, 200, 80, 255]);
  return img;
}

console.log('\n— Raster: pixels, blending, shapes —');
{
  const img = R.createImage(64, 64);
  eq(img.data.length, 64 * 64 * 4, 'createImage: allocates width*height*4 RGBA bytes');
  eq(pixel(img, 10, 10)[3], 0, 'createImage: starts fully transparent');

  R.clear(img, [10, 20, 30, 255]);
  assert.deepStrictEqual(pixel(img, 0, 0), [10, 20, 30, 255]);
  passed++; console.log('  ✔ clear: fills every pixel with the given RGBA');

  R.fillRect(img, 8, 8, 16, 16, [255, 0, 0, 255]);
  assert.deepStrictEqual(pixel(img, 12, 12), [255, 0, 0, 255]);
  passed++; console.log('  ✔ fillRect: opaque fill replaces pixels inside the rect');
  assert.deepStrictEqual(pixel(img, 30, 30), [10, 20, 30, 255]);
  passed++; console.log('  ✔ fillRect: pixels outside the rect are untouched');

  // 50% white over black background should land mid-gray
  const img2 = R.createImage(8, 8);
  R.clear(img2, [0, 0, 0, 255]);
  R.fillRect(img2, 0, 0, 8, 8, [255, 255, 255, 128]);
  const p = pixel(img2, 4, 4);
  approx(p[0], 128, 2, 'blendPixel: 50% white over black blends to ~mid-gray');
  eq(p[3], 255, 'blendPixel: alpha stays opaque when blending onto an opaque base');

  // ellipse: center inside, corner outside
  const img3 = R.createImage(40, 40);
  R.fillEllipse(img3, 20, 20, 10, 10, [0, 255, 0, 255]);
  eq(pixel(img3, 20, 20)[1], 255, 'fillEllipse: center pixel is filled');
  eq(pixel(img3, 2, 2)[3], 0, 'fillEllipse: far corner stays transparent');

  // polygon: triangle covers its centroid, not the opposite corner
  const img4 = R.createImage(40, 40);
  R.fillPoly(img4, [[2, 2], [38, 2], [2, 38]], [0, 0, 255, 255]);
  eq(pixel(img4, 10, 10)[2], 255, 'fillPoly: point inside the triangle is filled');
  eq(pixel(img4, 36, 36)[3], 0, 'fillPoly: point outside the triangle stays transparent');

  // linear gradient: top stop vs bottom stop
  const img5 = R.createImage(10, 100);
  R.fillRect(img5, 0, 0, 10, 100, {
    type: 'linear', from: [0, 0], to: [0, 1],
    stops: [[0, [0, 0, 0, 255]], [1, [200, 200, 200, 255]]],
  });
  ok(pixel(img5, 5, 2)[0] < 20, 'gradient: pixel near the first stop is near-black');
  ok(pixel(img5, 5, 97)[0] > 180, 'gradient: pixel near the last stop is near the end color');
  ok(pixel(img5, 5, 50)[0] > 60 && pixel(img5, 5, 50)[0] < 140, 'gradient: midpoint interpolates between stops');

  // hex + shade helpers
  assert.deepStrictEqual(R.hexToRgba('#ff8000'), [255, 128, 0, 255]);
  passed++; console.log('  ✔ hexToRgba: #ff8000 -> [255,128,0,255]');
  assert.deepStrictEqual(R.hexToRgba('#fff'), [255, 255, 255, 255]);
  passed++; console.log('  ✔ hexToRgba: 3-digit shorthand expands correctly');
  assert.deepStrictEqual(R.shadeRgba([100, 200, 50, 255], 0.5), [50, 100, 25, 255]);
  passed++; console.log('  ✔ shadeRgba: scales RGB, preserves alpha');
}

console.log('\n— Homography: perspective mapping —');
{
  const quad = [[100, 50], [300, 80], [280, 260], [90, 230]];
  const H = T ? R.solveHomography([[0, 0], [1, 0], [1, 1], [0, 1]], quad) : null;
  const apply = (m, u, v) => {
    const w = m[6] * u + m[7] * v + m[8];
    return [(m[0] * u + m[1] * v + m[2]) / w, (m[3] * u + m[4] * v + m[5]) / w];
  };
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (let i = 0; i < 4; i++) {
    const [x, y] = apply(H, corners[i][0], corners[i][1]);
    approx(x, quad[i][0], 1e-6, `homography: unit corner ${i} maps to quad x=${quad[i][0]}`);
    approx(y, quad[i][1], 1e-6, `homography: unit corner ${i} maps to quad y=${quad[i][1]}`);
  }
  const Hi = R.invert3(H);
  const [u, v] = apply(Hi, ...apply(H, 0.3, 0.7));
  approx(u, 0.3, 1e-9, 'homography: inverse round-trips u');
  approx(v, 0.7, 1e-9, 'homography: inverse round-trips v');

  assert.throws(() => R.solveHomography([[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [0, 0], [0, 0], [0, 0]]));
  passed++; console.log('  ✔ homography: degenerate quad throws instead of producing garbage');

  // insetQuad keeps points inside the parent quad
  const inset = R.insetQuad(quad, 0.1, 0.1, 0.1, 0.1);
  let minX = Math.min(...quad.map((p) => p[0])), maxX = Math.max(...quad.map((p) => p[0]));
  for (const [x] of inset) ok(x > minX && x < maxX, `insetQuad: inset x=${Math.round(x)} stays inside parent bounds`);
}

console.log('\n— Warp: fits, offsets, shading —');
{
  const design = makeDesign(200, 100); // 2:1 design
  const dst = R.createImage(100, 100);
  R.clear(dst, [0, 0, 0, 255]);
  const quad = [[10, 10], [90, 10], [90, 90], [10, 90]]; // square zone

  // stretch: whole design fills whole zone -> TL of zone shows design's TL (red)
  R.drawWarpedImage(dst, design, quad, { fit: 'stretch' });
  const tl = pixel(dst, 14, 14);
  ok(tl[0] > 150 && tl[2] < 100, 'warp stretch: zone top-left shows the design top-left quadrant (red)');
  const tr = pixel(dst, 86, 14);
  ok(tr[2] > 150 && tr[0] < 100, 'warp stretch: zone top-right shows the design top-right quadrant (blue)');
  const center = pixel(dst, 50, 50);
  ok(center[1] > 120, 'warp stretch: green center dot of the design lands at zone center');

  // cover on a square zone with a 2:1 design crops the sides: still fully painted
  const dstCover = R.createImage(100, 100);
  R.drawWarpedImage(dstCover, design, quad, { fit: 'cover', zoneAspect: 1 });
  eq(pixel(dstCover, 50, 12)[3], 255, 'warp cover: zone is fully covered (top edge painted)');
  eq(pixel(dstCover, 50, 88)[3], 255, 'warp cover: zone is fully covered (bottom edge painted)');

  // contain letterboxes: top strip of the zone remains unpainted
  const dstContain = R.createImage(100, 100);
  R.drawWarpedImage(dstContain, design, quad, { fit: 'contain', zoneAspect: 1 });
  eq(pixel(dstContain, 50, 12)[3], 0, 'warp contain: 2:1 design letterboxes inside a square zone (top strip empty)');
  eq(pixel(dstContain, 50, 50)[3], 255, 'warp contain: middle band is painted');

  // offsetX shifts the sampled content
  const dstOff = R.createImage(100, 100);
  R.clear(dstOff, [0, 0, 0, 255]);
  R.drawWarpedImage(dstOff, design, quad, { fit: 'stretch', offsetX: 0.25 });
  const shifted = pixel(dstOff, 50, 50);
  ok(shifted[1] < 120, 'warp offsetX: center dot moves away from zone center when offset applied');

  // multiplyUnder darkens design over a dark base
  const dark = R.createImage(100, 100);
  R.clear(dark, [40, 40, 40, 255]);
  R.drawWarpedImage(dark, design, quad, { fit: 'stretch', multiplyUnder: true });
  const lit = R.createImage(100, 100);
  R.clear(lit, [255, 255, 255, 255]);
  R.drawWarpedImage(lit, design, quad, { fit: 'stretch', multiplyUnder: true });
  ok(pixel(dark, 14, 14)[0] < pixel(lit, 14, 14)[0],
    'warp multiplyUnder: design is darker over dark fabric than over light fabric');

  // transparent source pixels never paint
  const holey = R.createImage(10, 10); // fully transparent design
  const dstHole = R.createImage(100, 100);
  R.drawWarpedImage(dstHole, holey, quad, { fit: 'stretch' });
  eq(pixel(dstHole, 50, 50)[3], 0, 'warp: fully transparent design leaves the destination untouched');
}

console.log('\n— Templates: pack integrity —');
{
  ok(T.TEMPLATES.length >= 12, `pack ships ${T.TEMPLATES.length} templates (>= 12)`);
  const cats = new Set(T.TEMPLATES.map((t) => t.category));
  for (const c of ['devices', 'apparel', 'print']) ok(cats.has(c), `pack covers the '${c}' category`);
  const ids = new Set();
  for (const tpl of T.TEMPLATES) {
    assert.ok(!ids.has(tpl.id), `duplicate template id ${tpl.id}`);
    ids.add(tpl.id);
    assert.ok(tpl.width > 0 && tpl.height > 0, `${tpl.id}: has export dimensions`);
    assert.ok(Array.isArray(tpl.zone.quad) && tpl.zone.quad.length === 4, `${tpl.id}: has a 4-point placement quad`);
    for (const [x, y] of tpl.zone.quad) {
      assert.ok(x >= 0 && x <= tpl.width && y >= 0 && y <= tpl.height, `${tpl.id}: quad point inside canvas`);
    }
    assert.ok(tpl.zone.aspect > 0, `${tpl.id}: zone aspect is positive`);
  }
  passed++; console.log(`  ✔ all ${T.TEMPLATES.length} templates: unique ids, valid dimensions, in-bounds placement quads`);
  ok(T.getTemplate('phone-front') !== null, 'getTemplate: finds a template by id');
  eq(T.getTemplate('nope'), null, 'getTemplate: returns null for unknown id');
  ok(T.GARMENT_COLORS.length >= 6, `ships ${T.GARMENT_COLORS.length} garment color variants (>= 6)`);
}

console.log('\n— Templates: end-to-end rendering —');
{
  const design = makeDesign(400, 400);
  for (const tpl of T.TEMPLATES) {
    const img = T.renderTemplate(tpl, design, { resolution: 0.25 });
    eq(img.width, Math.round(tpl.width * 0.25), `${tpl.id}: renders at requested resolution (w=${img.width})`);
    // scene must not be empty: some pixel near the zone center is painted
    const q = tpl.zone.quad;
    const cx = Math.round((q[0][0] + q[2][0]) / 2 * 0.25);
    const cy = Math.round((q[0][1] + q[2][1]) / 2 * 0.25);
    ok(pixel(img, cx, cy)[3] > 0, `${tpl.id}: design area is painted after render`);
  }

  // transparent-bg template keeps alpha at the true corner, opaque scenes don't
  const sticker = T.renderTemplate(T.getTemplate('sticker-clean'), design, { resolution: 0.25 });
  eq(pixel(sticker, 1, 1)[3], 0, 'sticker-clean: exports with a transparent background corner');
  const phone = T.renderTemplate(T.getTemplate('phone-front'), design, { resolution: 0.25 });
  eq(pixel(phone, 1, 1)[3], 255, 'phone-front: studio scene corner is opaque');

  // empty-scene render (no design) also works
  const empty = T.renderTemplate(T.getTemplate('laptop-front'), null, { resolution: 0.2 });
  ok(pixel(empty, 5, 5)[3] === 255, 'renderTemplate: null design renders the empty scene without crashing');

  // garment variant changes apparel pixels but device screens are unaffected by it
  const shirtWhite = T.renderTemplate(T.getTemplate('tshirt-flat'), null, { resolution: 0.25, garment: '#f2f2ef' });
  const shirtBlack = T.renderTemplate(T.getTemplate('tshirt-flat'), null, { resolution: 0.25, garment: '#23252b' });
  const gx = Math.round(800 * 0.25), gy = Math.round(900 * 0.25); // on the shirt body
  ok(pixel(shirtWhite, gx, gy)[0] - pixel(shirtBlack, gx, gy)[0] > 100,
    'garment variants: white vs black shirt differ strongly on the garment body');
  const bgW = pixel(shirtWhite, 3, 3), bgB = pixel(shirtBlack, 3, 3);
  approx(bgW[0], bgB[0], 2, 'garment variants: studio background is unaffected by garment color');
}

console.log('\n— PNG codec + batch export to disk —');
{
  // codec round-trip on a small image
  const src = makeDesign(37, 23); // odd sizes to catch stride bugs
  const buf = PNG.encode(src);
  ok(buf.subarray(0, 8).equals(PNG.SIGNATURE), 'png: encoded buffer starts with the PNG signature');
  const hdr = PNG.readHeader(buf);
  eq(hdr.width, 37, 'png: IHDR width matches source');
  eq(hdr.height, 23, 'png: IHDR height matches source');
  eq(hdr.colorType, 6, 'png: encodes as RGBA (color type 6)');
  const back = PNG.decode(buf);
  assert.deepStrictEqual(Array.from(back.data), Array.from(src.data));
  passed++; console.log('  ✔ png: encode -> decode round-trips every byte');
  assert.throws(() => PNG.readHeader(Buffer.from('definitely not a png, sorry')));
  passed++; console.log('  ✔ png: readHeader rejects non-PNG data');

  // batch: render EVERY template with a real design and write real files
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mockcraft-test-'));
  const design = makeDesign(300, 300);
  let bytes = 0;
  for (const tpl of T.TEMPLATES) {
    const img = T.renderTemplate(tpl, design, { resolution: 0.25, garment: '#2b3a5c' });
    const file = path.join(dir, `mockcraft-${tpl.id}.png`);
    fs.writeFileSync(file, PNG.encode(img));
    const onDisk = fs.readFileSync(file);
    const h = PNG.readHeader(onDisk);
    assert.strictEqual(h.width, img.width);
    assert.strictEqual(h.height, img.height);
    assert.ok(onDisk.length > 1000, `${tpl.id}: exported PNG is non-trivial (${onDisk.length} bytes)`);
    bytes += onDisk.length;
  }
  passed++; console.log(`  ✔ batch export: ${T.TEMPLATES.length} valid PNGs written to disk (${Math.round(bytes / 1024)} KB total), headers verified`);

  // decoded sticker export keeps its alpha channel on disk
  const sticker = T.renderTemplate(T.getTemplate('sticker-clean'), design, { resolution: 0.25 });
  const stickerBack = PNG.decode(fs.readFileSync(path.join(dir, 'mockcraft-sticker-clean.png')));
  eq(stickerBack.data[3], 0, 'batch export: transparent-bg template keeps alpha=0 corner after disk round-trip');
  eq(stickerBack.width, sticker.width, 'batch export: decoded sticker dimensions match the render');

  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\nAll good — ${passed} assertions passed.\n`);
