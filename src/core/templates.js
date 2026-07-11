/*
 * Mockcraft template pack — data-driven mockup scenes.
 * Every template is vector-defined (rects, round-rects, ellipses, polys,
 * gradients) plus a placement-zone quad, so scenes render at any resolution
 * with zero bitmap assets. Extensible: add an object here (or load an
 * external templates.json with the same shape) to add a template.
 *
 * Template shape:
 * {
 *   id, name, category ('devices'|'apparel'|'print'),
 *   width, height,             // export resolution
 *   transparentBg (bool),      // export with alpha background
 *   colorable (bool),          // supports garment color variants
 *   layers: [ op, ... ],       // drawn in order, before the design
 *   overlays: [ op, ... ],     // drawn after the design (shading, gloss)
 *   zone: { quad: [[x,y]x4] clockwise from TL, aspect, perspective, multiplyUnder }
 * }
 * op.color may be '$garment' or { var:'$garment', shade:0.8 } for tintables.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./raster'));
  } else {
    root.MockcraftTemplates = factory(root.MockcraftRaster);
  }
})(typeof self !== 'undefined' ? self : this, function (R) {
  'use strict';

  const GARMENT_COLORS = [
    { id: 'white', hex: '#f2f2ef' }, { id: 'black', hex: '#23252b' },
    { id: 'navy', hex: '#2b3a5c' }, { id: 'heather', hex: '#9aa0a8' },
    { id: 'red', hex: '#b3382f' }, { id: 'forest', hex: '#2f5d43' },
    { id: 'sand', hex: '#d8c9a8' }, { id: 'royal', hex: '#2f5fbe' },
  ];

  const studioBg = (a, b) => ({
    type: 'linear', from: [0, 0], to: [0, 1],
    stops: [[0, R.hexToRgba(a)], [1, R.hexToRgba(b)]],
  });

  function deviceScreenGloss(quad) {
    // subtle diagonal gloss polygon over the screen
    const g = R.insetQuad(quad, 0, 0, 0.45, 0);
    return { op: 'poly', points: [g[0], g[1], [g[1][0] - (g[1][0] - g[0][0]) * 0.4, g[2][1]], g[3]], color: [255, 255, 255, 14] };
  }

  const TEMPLATES = [
    // ---------------- DEVICES ----------------
    (() => {
      const W = 1600, H = 1200;
      const bw = 430, bh = 880, bx = (W - bw) / 2, by = (H - bh) / 2;
      const quad = [[bx + 22, by + 22], [bx + bw - 22, by + 22], [bx + bw - 22, by + bh - 22], [bx + 22, by + bh - 22]];
      return {
        id: 'phone-front', name: 'Phone — Front', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#1b1e27', '#2a2f3d') },
          { op: 'ellipse', cx: W / 2, cy: by + bh + 30, rx: 330, ry: 40, color: [0, 0, 0, 90] },
          { op: 'roundRect', x: bx, y: by, w: bw, h: bh, r: 64, color: [14, 15, 18, 255] },
          { op: 'roundRect', x: bx + 6, y: by + 6, w: bw - 12, h: bh - 12, r: 58, color: [40, 42, 48, 255] },
          { op: 'roundRect', x: bx + 12, y: by + 12, w: bw - 24, h: bh - 24, r: 52, color: [8, 8, 10, 255] },
        ],
        overlays: [
          { op: 'roundRect', x: W / 2 - 62, y: by + 34, w: 124, h: 34, r: 17, color: [8, 8, 10, 255] },
          { op: 'ellipse', cx: W / 2 + 38, cy: by + 51, rx: 7, ry: 7, color: [30, 34, 44, 255] },
          deviceScreenGloss(quad),
        ],
        zone: { quad, aspect: (bw - 44) / (bh - 44), perspective: false },
      };
    })(),
    (() => {
      const W = 1600, H = 1200;
      // tilted phone: hand-tuned quad with perspective
      const body = [[560, 200], [1080, 260], [1020, 1030], [470, 940]];
      const quad = R.insetQuad(body, 0.055, 0.05, 0.055, 0.05);
      return {
        id: 'phone-angled', name: 'Phone — Angled', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#241f33', '#171522') },
          { op: 'ellipse', cx: 770, cy: 1010, rx: 380, ry: 46, color: [0, 0, 0, 100] },
          { op: 'poly', points: R.insetQuad(body, -0.012, -0.008, -0.012, -0.008), color: [12, 12, 16, 255] },
          { op: 'poly', points: body, color: [42, 44, 52, 255] },
          { op: 'poly', points: R.insetQuad(body, 0.03, 0.026, 0.03, 0.026), color: [8, 8, 10, 255] },
        ],
        overlays: [deviceScreenGloss(quad)],
        zone: { quad, aspect: 0.5, perspective: true },
      };
    })(),
    (() => {
      const W = 1920, H = 1200;
      const sw = 1150, sh = 720, sx = (W - sw) / 2, sy = 130;
      const quad = [[sx + 34, sy + 34], [sx + sw - 34, sy + 34], [sx + sw - 34, sy + sh - 24], [sx + 34, sy + sh - 24]];
      return {
        id: 'laptop-front', name: 'Laptop — Front', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#20242e', '#141720') },
          { op: 'ellipse', cx: W / 2, cy: sy + sh + 110, rx: 760, ry: 44, color: [0, 0, 0, 90] },
          { op: 'roundRect', x: sx, y: sy, w: sw, h: sh, r: 30, color: [30, 32, 38, 255] },
          { op: 'roundRect', x: sx + 14, y: sy + 14, w: sw - 28, h: sh - 28, r: 16, color: [8, 8, 10, 255] },
          // deck
          { op: 'poly', points: [[sx - 160, sy + sh], [sx + sw + 160, sy + sh], [sx + sw + 220, sy + sh + 78], [sx - 220, sy + sh + 78]], color: { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, R.hexToRgba('#3a3d46')], [1, R.hexToRgba('#22242b')]] } },
          { op: 'roundRect', x: W / 2 - 130, y: sy + sh, w: 260, h: 16, r: 8, color: [18, 19, 23, 255] },
        ],
        overlays: [deviceScreenGloss(quad)],
        zone: { quad, aspect: (sw - 68) / (sh - 58), perspective: false },
      };
    })(),
    (() => {
      const W = 1920, H = 1200;
      const body = [[430, 180], [1420, 260], [1360, 900], [330, 800]];
      const quad = R.insetQuad(body, 0.03, 0.045, 0.03, 0.045);
      return {
        id: 'laptop-angled', name: 'Laptop — Angled', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#16202a', '#0e141c') },
          { op: 'ellipse', cx: 900, cy: 1010, rx: 720, ry: 50, color: [0, 0, 0, 110] },
          { op: 'poly', points: R.insetQuad(body, -0.008, -0.01, -0.008, -0.01), color: [34, 36, 42, 255] },
          { op: 'poly', points: R.insetQuad(body, 0.012, 0.018, 0.012, 0.018), color: [8, 8, 10, 255] },
          { op: 'poly', points: [[330, 800], [1360, 900], [1560, 1000], [220, 890]], color: { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, R.hexToRgba('#454954')], [1, R.hexToRgba('#23252c')]] } },
          { op: 'poly', points: [[220, 890], [1560, 1000], [1548, 1022], [214, 910]], color: [16, 17, 20, 255] },
        ],
        overlays: [deviceScreenGloss(quad)],
        zone: { quad, aspect: 1.55, perspective: true },
      };
    })(),
    (() => {
      const W = 1600, H = 1200;
      const bw = 700, bh = 940, bx = (W - bw) / 2, by = (H - bh) / 2;
      const quad = [[bx + 40, by + 40], [bx + bw - 40, by + 40], [bx + bw - 40, by + bh - 40], [bx + 40, by + bh - 40]];
      return {
        id: 'tablet-front', name: 'Tablet — Front', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#232031', '#151320') },
          { op: 'ellipse', cx: W / 2, cy: by + bh + 26, rx: 480, ry: 42, color: [0, 0, 0, 90] },
          { op: 'roundRect', x: bx, y: by, w: bw, h: bh, r: 46, color: [36, 38, 44, 255] },
          { op: 'roundRect', x: bx + 8, y: by + 8, w: bw - 16, h: bh - 16, r: 40, color: [8, 8, 10, 255] },
        ],
        overlays: [deviceScreenGloss(quad)],
        zone: { quad, aspect: (bw - 80) / (bh - 80), perspective: false },
      };
    })(),
    (() => {
      const W = 1920, H = 1200;
      const wx = 240, wy = 140, ww = 1440, wh = 920;
      const bar = 64;
      const quad = [[wx + 2, wy + bar], [wx + ww - 2, wy + bar], [wx + ww - 2, wy + wh - 2], [wx + 2, wy + wh - 2]];
      return {
        id: 'browser-window', name: 'Browser Window', category: 'devices', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#1d2733', '#121822') },
          { op: 'ellipse', cx: W / 2, cy: wy + wh + 30, rx: 780, ry: 44, color: [0, 0, 0, 80] },
          { op: 'roundRect', x: wx, y: wy, w: ww, h: wh, r: 18, color: [15, 16, 20, 255] },
          { op: 'roundRect', x: wx, y: wy, w: ww, h: bar + 18, r: 18, color: [42, 45, 52, 255] },
          { op: 'rect', x: wx, y: wy + bar - 6, w: ww, h: 6, color: [42, 45, 52, 255] },
          { op: 'ellipse', cx: wx + 42, cy: wy + bar / 2, rx: 10, ry: 10, color: R.hexToRgba('#ff5f57') },
          { op: 'ellipse', cx: wx + 76, cy: wy + bar / 2, rx: 10, ry: 10, color: R.hexToRgba('#febc2e') },
          { op: 'ellipse', cx: wx + 110, cy: wy + bar / 2, rx: 10, ry: 10, color: R.hexToRgba('#28c840') },
          { op: 'roundRect', x: wx + 160, y: wy + 14, w: ww - 320, h: bar - 28, r: (bar - 28) / 2, color: [25, 27, 32, 255] },
        ],
        overlays: [],
        zone: { quad, aspect: (ww - 4) / (wh - bar - 2), perspective: false },
      };
    })(),

    // ---------------- APPAREL ----------------
    (() => {
      const W = 1600, H = 1600;
      const cx = W / 2;
      const g = (shade) => ({ var: '$garment', shade });
      const quad = [[cx - 250, 560], [cx + 250, 560], [cx + 250, 1160], [cx - 250, 1160]];
      return {
        id: 'tshirt-flat', name: 'T-Shirt — Flat', category: 'apparel', width: W, height: H, colorable: true,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#e9e7e2', '#d4d1ca') },
          { op: 'ellipse', cx, cy: 1420, rx: 560, ry: 46, color: [0, 0, 0, 45] },
          // sleeves
          { op: 'poly', points: [[cx - 340, 360], [cx - 560, 520], [cx - 480, 700], [cx - 350, 620]], color: g(0.88) },
          { op: 'poly', points: [[cx + 340, 360], [cx + 560, 520], [cx + 480, 700], [cx + 350, 620]], color: g(0.88) },
          // body
          { op: 'roundRect', x: cx - 360, y: 330, w: 720, h: 1060, r: 70, color: g(1) },
          // collar
          { op: 'ellipse', cx, cy: 350, rx: 150, ry: 74, color: g(0.72) },
          { op: 'ellipse', cx, cy: 336, rx: 122, ry: 54, color: studioBg('#e9e7e2', '#d4d1ca') },
        ],
        overlays: [
          { op: 'poly', points: [[cx - 360, 330], [cx - 300, 330], [cx - 330, 1390], [cx - 360, 1390]], color: [0, 0, 0, 16] },
          { op: 'poly', points: [[cx + 300, 330], [cx + 360, 330], [cx + 360, 1390], [cx + 330, 1390]], color: [0, 0, 0, 16] },
        ],
        zone: { quad, aspect: 500 / 600, perspective: false, multiplyUnder: true },
      };
    })(),
    (() => {
      const W = 1600, H = 1600;
      const cx = W / 2;
      const g = (shade) => ({ var: '$garment', shade });
      const quad = [[cx - 230, 640], [cx + 230, 640], [cx + 230, 1080], [cx - 230, 1080]];
      return {
        id: 'hoodie-flat', name: 'Hoodie — Flat', category: 'apparel', width: W, height: H, colorable: true,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#e5e3df', '#cfccc5') },
          { op: 'ellipse', cx, cy: 1440, rx: 600, ry: 48, color: [0, 0, 0, 45] },
          { op: 'poly', points: [[cx - 350, 400], [cx - 590, 580], [cx - 500, 780], [cx - 360, 690]], color: g(0.86) },
          { op: 'poly', points: [[cx + 350, 400], [cx + 590, 580], [cx + 500, 780], [cx + 360, 690]], color: g(0.86) },
          { op: 'roundRect', x: cx - 380, y: 380, w: 760, h: 1040, r: 80, color: g(1) },
          // hood
          { op: 'ellipse', cx, cy: 400, rx: 250, ry: 150, color: g(0.8) },
          { op: 'ellipse', cx, cy: 420, rx: 180, ry: 100, color: g(0.6) },
          // kangaroo pocket
          { op: 'poly', points: [[cx - 250, 1120], [cx + 250, 1120], [cx + 190, 1330], [cx - 190, 1330]], color: g(0.9) },
          // drawstrings
          { op: 'roundRect', x: cx - 70, y: 500, w: 14, h: 170, r: 7, color: g(0.55) },
          { op: 'roundRect', x: cx + 56, y: 500, w: 14, h: 170, r: 7, color: g(0.55) },
        ],
        overlays: [],
        zone: { quad, aspect: 460 / 440, perspective: false, multiplyUnder: true },
      };
    })(),

    // ---------------- PRINT ----------------
    (() => {
      const W = 1920, H = 1200;
      // business card lying on a surface, slight perspective
      const card = [[560, 380], [1400, 430], [1330, 880], [470, 800]];
      return {
        id: 'business-card', name: 'Business Card', category: 'print', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#2e2a26', '#191614') },
          { op: 'poly', points: [[540, 420], [1420, 470], [1360, 930], [440, 840]], color: [0, 0, 0, 110] },
          { op: 'poly', points: card, color: [250, 250, 248, 255] },
        ],
        overlays: [
          { op: 'poly', points: [card[0], card[1], [card[1][0] - (card[1][0] - card[0][0]) * 0.5, (card[1][1] + card[2][1]) / 2], [card[0][0], (card[0][1] + card[3][1]) / 2]], color: [255, 255, 255, 10] },
        ],
        zone: { quad: R.insetQuad(card, 0.02, 0.03, 0.02, 0.03), aspect: 3.5 / 2, perspective: true },
      };
    })(),
    (() => {
      const W = 1600, H = 2000;
      const fx = 300, fy = 240, fw = 1000, fh = 1420;
      const quad = [[fx + 70, fy + 70], [fx + fw - 70, fy + 70], [fx + fw - 70, fy + fh - 70], [fx + 70, fy + fh - 70]];
      return {
        id: 'poster-frame', name: 'Framed Poster', category: 'print', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#d9d4cb', '#bcb6aa') },
          { op: 'rect', x: 0, y: H - 260, w: W, h: 260, color: { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, R.hexToRgba('#a89f90')], [1, R.hexToRgba('#8f8677')]] } },
          { op: 'rect', x: fx + 18, y: fy + 26, w: fw, h: fh, color: [0, 0, 0, 70] },
          { op: 'rect', x: fx, y: fy, w: fw, h: fh, color: [26, 24, 22, 255] },
          { op: 'rect', x: fx + 26, y: fy + 26, w: fw - 52, h: fh - 52, color: [245, 243, 238, 255] },
        ],
        overlays: [],
        zone: { quad, aspect: (fw - 140) / (fh - 140), perspective: false },
      };
    })(),
    (() => {
      const W = 1920, H = 1400;
      // standing book, front cover slightly angled + spine + page block
      const cover = [[760, 220], [1330, 300], [1330, 1160], [760, 1210]];
      return {
        id: 'book-cover', name: 'Book Cover', category: 'print', width: W, height: H,
        layers: [
          { op: 'rect', x: 0, y: 0, w: W, h: H, color: studioBg('#243036', '#131b20') },
          { op: 'ellipse', cx: 1010, cy: 1230, rx: 420, ry: 40, color: [0, 0, 0, 110] },
          // page block (left of cover)
          { op: 'poly', points: [[700, 260], [760, 220], [760, 1210], [700, 1180]], color: [232, 228, 218, 255] },
          { op: 'poly', points: [[706, 300], [752, 268], [752, 1170], [706, 1140]], color: [205, 200, 188, 255] },
          // cover base (design goes on top)
          { op: 'poly', points: cover, color: [40, 44, 52, 255] },
        ],
        overlays: [
          { op: 'poly', points: [[760, 220], [790, 224], [790, 1207], [760, 1210]], color: [0, 0, 0, 60] },
        ],
        zone: { quad: cover, aspect: 6 / 9, perspective: true },
      };
    })(),
    (() => {
      const W = 1600, H = 1600;
      const quad = [[420, 420], [1180, 420], [1180, 1180], [420, 1180]];
      return {
        id: 'sticker-clean', name: 'Sticker (Transparent)', category: 'print', width: W, height: H,
        transparentBg: true,
        layers: [
          { op: 'ellipse', cx: 800, cy: 812, rx: 420, ry: 420, color: [0, 0, 0, 40] },
          { op: 'ellipse', cx: 800, cy: 800, rx: 420, ry: 420, color: [252, 252, 250, 255] },
        ],
        overlays: [],
        zone: { quad, aspect: 1, perspective: false },
      };
    })(),
  ];

  function resolveColor(color, garmentHex) {
    if (typeof color === 'string' && color === '$garment') return R.hexToRgba(garmentHex);
    if (color && color.var === '$garment') return R.shadeRgba(R.hexToRgba(garmentHex), color.shade == null ? 1 : color.shade);
    return color;
  }

  function drawOps(img, ops, garmentHex) {
    for (const o of ops) {
      const color = resolveColor(o.color, garmentHex);
      if (o.op === 'rect') R.fillRect(img, o.x, o.y, o.w, o.h, color);
      else if (o.op === 'roundRect') R.fillRoundRect(img, o.x, o.y, o.w, o.h, o.r, color);
      else if (o.op === 'ellipse') R.fillEllipse(img, o.cx, o.cy, o.rx, o.ry, color);
      else if (o.op === 'poly') R.fillPoly(img, o.points, color);
    }
  }

  /**
   * Render a template with a design image.
   * design: raster image or null (renders the empty scene).
   * opts: { garment: hex, scale, offsetX, offsetY, rotation, fit, resolution (0..1 multiplier) }
   */
  function renderTemplate(template, design, opts) {
    opts = opts || {};
    const res = opts.resolution || 1;
    const W = Math.round(template.width * res), H = Math.round(template.height * res);
    const img = R.createImage(W, H); // starts fully transparent; opaque scenes paint a bg layer
    const scaleOps = (ops) => ops.map((o) => {
      const c = Object.assign({}, o);
      for (const k of ['x', 'y', 'w', 'h', 'r', 'cx', 'cy', 'rx', 'ry']) if (c[k] != null) c[k] *= res;
      if (c.points) c.points = c.points.map((p) => [p[0] * res, p[1] * res]);
      return c;
    });
    const garment = opts.garment || GARMENT_COLORS[0].hex;
    drawOps(img, scaleOps(template.layers), garment);
    if (design) {
      const quad = template.zone.quad.map((p) => [p[0] * res, p[1] * res]);
      R.drawWarpedImage(img, design, quad, {
        scale: opts.scale || 1,
        offsetX: opts.offsetX || 0,
        offsetY: opts.offsetY || 0,
        rotation: opts.rotation || 0,
        fit: opts.fit || 'cover',
        zoneAspect: template.zone.aspect,
        multiplyUnder: !!template.zone.multiplyUnder,
        opacity: 1,
      });
    }
    drawOps(img, scaleOps(template.overlays || []), garment);
    return img;
  }

  function getTemplate(id) {
    return TEMPLATES.find((t) => t.id === id) || null;
  }

  return { TEMPLATES, GARMENT_COLORS, renderTemplate, getTemplate };
});
