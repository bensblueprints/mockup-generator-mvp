# ◪ Mockcraft

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**The product mockup generator you buy once and own forever.** Drop your design or screenshot onto a phone, laptop, tablet, browser window, t-shirt, hoodie, business card, framed poster, book cover, or sticker scene — with real perspective warping onto angled surfaces, garment color variants, and a batch mode that exports one design across every template in a single pass. 100% local, zero subscription, zero cloud, zero telemetry.

Placeit charges **$14.95/month, forever**, to drag your image onto a stock photo of a phone. Mockcraft is **$19 once**. Your mockups are not a subscription.

![Mockcraft screenshot](docs/screenshot.png)

## ☕ Skip the setup — get the 1-click installer

Don't want to touch a terminal? Grab the packaged Windows installer (and support development):

**→ [Get Mockcraft on Whop](https://whop.com/onetime-suite)** — pay once, own it forever.

## Features

- 📱 **12 bundled mockup templates** across three categories — devices (phone front/angled, laptop front/angled, tablet, browser window), apparel (t-shirt, hoodie), and print (business card, framed poster, book cover, transparent-background sticker)
- 🧭 **Real perspective placement** — angled scenes use a full homography (projective) transform with bilinear sampling, not a naive skew, so your design sits on the screen/cover like it was photographed there
- 🎛️ **Placement controls** — scale, X/Y offset, rotation, and cover / contain / stretch fit modes, all live-previewed as you drag the sliders
- 👕 **Garment color variants** — 8 swatches swap the shirt/hoodie color instantly without re-placing your design, and the design is multiply-shaded into the fabric so it looks printed, not pasted
- 🗂️ **Batch mode** — check any set of templates and export your design across all of them in one pass, straight into a folder you pick
- 🖼️ **Marketing-resolution PNG export** — every template exports at its full scene resolution (1600–1920px wide), with a true alpha channel on transparent-background templates
- 🧩 **Data-driven, extensible template pack** — every scene is vector-defined (shapes + gradients + a placement-zone quad) in one spec file; add an object and you've added a template — no bitmap assets to license or bundle
- 🌑 Premium dark UI, drag-drop anywhere, fast and framework-free

## Template art — honesty note

Mockcraft does **not** ship stock photography of devices or models — that's exactly the licensed imagery Placeit rents you access to. Every bundled scene is honestly generated from vector shape specs (`src/core/templates.js`) rendered by Mockcraft's own raster engine, which means the whole pack is MIT-licensed with your copy, renders crisply at any resolution, and is trivially extensible.

## Quick start

```bash
git clone https://github.com/bensblueprints/mockcraft
cd mockcraft
npm i
npm start
```

Run the tests (raster engine + homography math + full template pack render + PNG batch export to disk):

```bash
npm test
```

Build the Windows installer:

```bash
npm run dist
```

## Mockcraft vs Placeit

| | **Mockcraft** | Placeit |
|---|---|---|
| Price | **$19 once** | $14.95/mo ($89.69/yr on annual) |
| Cost after 1 year | **$19** | $179.40 monthly ($89.69 annual) |
| Cost after 3 years | **$19** (28x cheaper) | $538.20 |
| Your files live | **On your machine** | Their cloud |
| Works offline | **Always** | No |
| Account required | **No** | Yes |
| Export resolution | **Full scene res, always** | Gated by plan |
| Batch one design across templates | **Yes, one pass** | Manual, one at a time |
| Perspective-correct placement | **Yes (true homography)** | Yes |
| Telemetry | **None** | Analytics SDKs |
| Template pack license | **MIT, extensible JSON spec** | Rented — lose access when you stop paying |
| Source code | **MIT, right here** | Closed |

**Pays for itself in under 2 months** of Placeit — and every month after that is pure savings.

## Tech stack

- **Electron** — main + preload (context-isolated) + plain HTML/CSS/JS renderer. No framework, no build step.
- **Pure raster engine** (`src/core/raster.js`) — zero dependencies; RGBA pixel ops, anti-aliased shape fills, linear gradients, scanline polygon fill, and a full perspective-warp pipeline (8×8 homography solve + bilinear sampling + multiply-under fabric shading). Runs identically in the renderer and under Node for tests — what you test is what you ship.
- **Data-driven template pack** (`src/core/templates.js`) — 12 vector-defined scenes with placement-zone quads, garment color variables, and per-scene overlays (screen gloss, shadows, frame bevels).
- **PNG codec** (`src/core/png.js`) — dependency-free Node PNG encoder/decoder (hand-assembled IHDR/IDAT/IEND chunks with CRC32, zlib deflate) used by the test suite and available for headless export.
- **electron-builder** — Windows NSIS one-click installer.

## Data & privacy

Everything stays on your machine. Mockcraft makes **no network calls at all**. Your designs never leave your disk; exports go exactly where you choose.

## License

[MIT](LICENSE) © 2026 Ben (bensblueprints)
