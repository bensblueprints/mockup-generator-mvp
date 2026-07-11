/*
 * Mockcraft raster engine — pure JS RGBA pixel operations.
 * Runs identically in Node (smoke tests / CLI export) and in the Electron
 * renderer (preview + export), so what you test is what you ship.
 * No native dependencies. Images are { width, height, data: Uint8ClampedArray }.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MockcraftRaster = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function createImage(width, height) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }

  function clear(img, rgba) {
    const [r, g, b, a] = rgba;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
    }
  }

  // color: [r,g,b,a] OR {type:'linear', from:[x,y], to:[x,y], stops:[[t,[r,g,b,a]],...]}
  // Coordinates in gradient are relative (0..1) to the shape's bounding box.
  function makeColorFn(color, bx, by, bw, bh) {
    if (Array.isArray(color)) return () => color;
    if (color && color.type === 'linear') {
      const x0 = bx + color.from[0] * bw, y0 = by + color.from[1] * bh;
      const x1 = bx + color.to[0] * bw, y1 = by + color.to[1] * bh;
      const dx = x1 - x0, dy = y1 - y0;
      const len2 = dx * dx + dy * dy || 1;
      const stops = color.stops;
      return (x, y) => {
        let t = ((x - x0) * dx + (y - y0) * dy) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        let i = 0;
        while (i < stops.length - 1 && stops[i + 1][0] < t) i++;
        const s0 = stops[i], s1 = stops[Math.min(i + 1, stops.length - 1)];
        const span = s1[0] - s0[0] || 1;
        const f = Math.max(0, Math.min(1, (t - s0[0]) / span));
        const c0 = s0[1], c1 = s1[1];
        return [
          c0[0] + (c1[0] - c0[0]) * f,
          c0[1] + (c1[1] - c0[1]) * f,
          c0[2] + (c1[2] - c0[2]) * f,
          c0[3] + (c1[3] - c0[3]) * f,
        ];
      };
    }
    return () => [255, 0, 255, 255]; // loud fallback for bad specs
  }

  function blendPixel(img, x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height || a <= 0) return;
    const i = (y * img.width + x) * 4;
    const d = img.data;
    const sa = a / 255;
    const da = d[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa <= 0) { d[i + 3] = 0; return; }
    d[i]     = (r * sa + d[i]     * da * (1 - sa)) / oa;
    d[i + 1] = (g * sa + d[i + 1] * da * (1 - sa)) / oa;
    d[i + 2] = (b * sa + d[i + 2] * da * (1 - sa)) / oa;
    d[i + 3] = oa * 255;
  }

  function fillRect(img, x, y, w, h, color) {
    const fn = makeColorFn(color, x, y, w, h);
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(img.width, Math.round(x + w)), y1 = Math.min(img.height, Math.round(y + h));
    for (let py = y0; py < y1; py++)
      for (let px = x0; px < x1; px++) {
        const c = fn(px, py);
        blendPixel(img, px, py, c[0], c[1], c[2], c[3]);
      }
  }

  function fillRoundRect(img, x, y, w, h, radius, color) {
    const fn = makeColorFn(color, x, y, w, h);
    const r = Math.min(radius, w / 2, h / 2);
    const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(img.width, Math.ceil(x + w)), y1 = Math.min(img.height, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const cx = px + 0.5, cy = py + 0.5;
        // distance to rounded-rect: coverage test with 1px soft edge
        const qx = Math.max(Math.abs(cx - (x + w / 2)) - (w / 2 - r), 0);
        const qy = Math.max(Math.abs(cy - (y + h / 2)) - (h / 2 - r), 0);
        const dist = Math.sqrt(qx * qx + qy * qy) - r;
        if (dist > 0.5) continue;
        const cov = dist < -0.5 ? 1 : 0.5 - dist;
        const c = fn(px, py);
        blendPixel(img, px, py, c[0], c[1], c[2], c[3] * cov);
      }
    }
  }

  function fillEllipse(img, cx, cy, rx, ry, color) {
    const fn = makeColorFn(color, cx - rx, cy - ry, rx * 2, ry * 2);
    const x0 = Math.max(0, Math.floor(cx - rx)), y0 = Math.max(0, Math.floor(cy - ry));
    const x1 = Math.min(img.width, Math.ceil(cx + rx)), y1 = Math.min(img.height, Math.ceil(cy + ry));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const nx = (px + 0.5 - cx) / rx, ny = (py + 0.5 - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d > 1) continue;
        const cov = Math.min(1, (1 - d) * Math.max(rx, ry)); // soft edge
        const c = fn(px, py);
        blendPixel(img, px, py, c[0], c[1], c[2], c[3] * Math.min(1, cov));
      }
    }
  }

  // Scanline fill of an arbitrary polygon (points: [[x,y],...]).
  function fillPoly(img, points, color) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of points) {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    const fn = makeColorFn(color, minX, minY, maxX - minX, maxY - minY);
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(img.height, Math.ceil(maxY));
    const n = points.length;
    for (let py = y0; py < y1; py++) {
      const yc = py + 0.5;
      const xs = [];
      for (let i = 0; i < n; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % n];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
          xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(img.width, Math.round(xs[k + 1]));
        for (let px = xa; px < xb; px++) {
          const c = fn(px, py);
          blendPixel(img, px, py, c[0], c[1], c[2], c[3]);
        }
      }
    }
  }

  // ---- Perspective (homography) ------------------------------------------
  // Solve 8x8 linear system mapping (u,v) unit square -> quad corners.
  function solveHomography(srcPts, dstPts) {
    const A = [];
    const B = [];
    for (let i = 0; i < 4; i++) {
      const [u, v] = srcPts[i];
      const [x, y] = dstPts[i];
      A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); B.push(x);
      A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); B.push(y);
    }
    // Gaussian elimination with partial pivoting
    for (let col = 0; col < 8; col++) {
      let piv = col;
      for (let r = col + 1; r < 8; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      [A[col], A[piv]] = [A[piv], A[col]];
      [B[col], B[piv]] = [B[piv], B[col]];
      const p = A[col][col];
      if (Math.abs(p) < 1e-12) throw new Error('Degenerate quad for homography');
      for (let r = 0; r < 8; r++) {
        if (r === col) continue;
        const f = A[r][col] / p;
        for (let c = col; c < 8; c++) A[r][c] -= f * A[col][c];
        B[r] -= f * B[col];
      }
    }
    const h = B.map((b, i) => b / A[i][i]);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }

  function invert3(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, Bc = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * Bc + c * C;
    if (Math.abs(det) < 1e-12) throw new Error('Singular homography');
    return [
      A / det, (c * h - b * i) / det, (b * f - c * e) / det,
      Bc / det, (a * i - c * g) / det, (c * d - a * f) / det,
      C / det, (b * g - a * h) / det, (a * e - b * d) / det,
    ];
  }

  function sampleBilinear(src, fx, fy) {
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, src.width - 1), y1 = Math.min(y0 + 1, src.height - 1);
    if (x0 < 0 || y0 < 0 || x0 >= src.width || y0 >= src.height) return [0, 0, 0, 0];
    const tx = fx - x0, ty = fy - y0;
    const d = src.data;
    const out = [0, 0, 0, 0];
    const i00 = (y0 * src.width + x0) * 4, i10 = (y0 * src.width + x1) * 4;
    const i01 = (y1 * src.width + x0) * 4, i11 = (y1 * src.width + x1) * 4;
    for (let k = 0; k < 4; k++) {
      const top = d[i00 + k] + (d[i10 + k] - d[i00 + k]) * tx;
      const bot = d[i01 + k] + (d[i11 + k] - d[i01 + k]) * tx;
      out[k] = top + (bot - top) * ty;
    }
    return out;
  }

  /**
   * Warp `src` into the destination quad with a full perspective transform.
   * quad: [[x,y] x4] clockwise from top-left.
   * opts: { scale=1, offsetX=0, offsetY=0 (fractions of zone), rotation=0 (deg),
   *         fit='cover'|'contain'|'stretch', zoneAspect (w/h of physical zone),
   *         opacity=1, multiplyUnder=false }
   * multiplyUnder: multiply src RGB with the existing dst pixel (fabric shading).
   */
  function drawWarpedImage(dst, src, quad, opts) {
    opts = opts || {};
    const scale = opts.scale || 1;
    const offX = opts.offsetX || 0, offY = opts.offsetY || 0;
    const rot = ((opts.rotation || 0) * Math.PI) / 180;
    const fit = opts.fit || 'cover';
    const opacity = opts.opacity == null ? 1 : opts.opacity;
    const H = solveHomography([[0, 0], [1, 0], [1, 1], [0, 1]], quad);
    const Hi = invert3(H);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of quad) {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    const zoneAspect = opts.zoneAspect || (maxX - minX) / Math.max(1, maxY - minY);
    const srcAspect = src.width / src.height;
    // fit design into the unit square honoring the zone's physical aspect
    let fw = 1, fh = 1; // fraction of unit square the design occupies
    if (fit !== 'stretch') {
      const rel = srcAspect / zoneAspect; // >1: design is wider than zone
      if (fit === 'cover') {
        if (rel > 1) { fw = rel; fh = 1; } else { fw = 1; fh = 1 / rel; }
      } else { // contain
        if (rel > 1) { fw = 1; fh = 1 / rel; } else { fw = rel; fh = 1; }
      }
    }
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const x0 = Math.max(0, Math.floor(minX)), y0 = Math.max(0, Math.floor(minY));
    const x1 = Math.min(dst.width, Math.ceil(maxX)), y1 = Math.min(dst.height, Math.ceil(maxY));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const cx = px + 0.5, cy = py + 0.5;
        const w = Hi[6] * cx + Hi[7] * cy + Hi[8];
        let u = (Hi[0] * cx + Hi[1] * cy + Hi[2]) / w;
        let v = (Hi[3] * cx + Hi[4] * cy + Hi[5]) / w;
        if (u < -0.001 || u > 1.001 || v < -0.001 || v > 1.001) continue;
        // user transform in zone space (aspect-corrected so rotation isn't skewed)
        let ux = (u - 0.5 - offX) * zoneAspect, uy = v - 0.5 - offY;
        const rx = (ux * cosR + uy * sinR) / zoneAspect, ry = -ux * sinR + uy * cosR;
        u = rx / scale + 0.5; v = ry / scale + 0.5;
        // map through fitted design rect
        const du = (u - 0.5) / fw + 0.5, dv = (v - 0.5) / fh + 0.5;
        if (du < 0 || du > 1 || dv < 0 || dv > 1) continue;
        const c = sampleBilinear(src, du * (src.width - 1), dv * (src.height - 1));
        if (c[3] <= 0) continue;
        if (opts.multiplyUnder) {
          const i = (py * dst.width + px) * 4;
          const shade = ((dst.data[i] + dst.data[i + 1] + dst.data[i + 2]) / 3) / 255;
          const s = 0.55 + 0.45 * shade; // keep fabric shading subtle
          c[0] *= s; c[1] *= s; c[2] *= s;
        }
        blendPixel(dst, px, py, c[0], c[1], c[2], c[3] * opacity);
      }
    }
  }

  // Simple axis-aligned bilinear blit (used for logo/scaled draws)
  function drawImageRect(dst, src, dx, dy, dw, dh, opacity) {
    opacity = opacity == null ? 1 : opacity;
    const x0 = Math.max(0, Math.round(dx)), y0 = Math.max(0, Math.round(dy));
    const x1 = Math.min(dst.width, Math.round(dx + dw)), y1 = Math.min(dst.height, Math.round(dy + dh));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const u = (px - dx) / dw, v = (py - dy) / dh;
        const c = sampleBilinear(src, u * (src.width - 1), v * (src.height - 1));
        if (c[3] > 0) blendPixel(dst, px, py, c[0], c[1], c[2], c[3] * opacity);
      }
    }
  }

  // Interpolate an inset quad inside a parent quad (bilinear corner interp).
  function insetQuad(quad, l, t, r, b) {
    const at = (u, v) => {
      const top = [quad[0][0] + (quad[1][0] - quad[0][0]) * u, quad[0][1] + (quad[1][1] - quad[0][1]) * u];
      const bot = [quad[3][0] + (quad[2][0] - quad[3][0]) * u, quad[3][1] + (quad[2][1] - quad[3][1]) * u];
      return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
    };
    return [at(l, t), at(1 - r, t), at(1 - r, 1 - b), at(l, 1 - b)];
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha == null ? 255 : alpha];
  }

  function shadeRgba(rgba, factor) {
    return [
      Math.max(0, Math.min(255, rgba[0] * factor)),
      Math.max(0, Math.min(255, rgba[1] * factor)),
      Math.max(0, Math.min(255, rgba[2] * factor)),
      rgba[3],
    ];
  }

  return {
    createImage, clear, fillRect, fillRoundRect, fillEllipse, fillPoly,
    drawWarpedImage, drawImageRect, insetQuad, solveHomography, invert3,
    sampleBilinear, hexToRgba, shadeRgba, blendPixel,
  };
});
