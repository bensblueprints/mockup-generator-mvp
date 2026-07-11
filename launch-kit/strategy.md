# Launch Strategy — Mockcraft

## Positioning
"Pay once. Own it forever. No subscription." Target indie hackers, app developers, print-on-demand sellers, and Etsy/e-commerce shop owners who need product mockups for launch pages, store listings, and ads — and resent renting access to templates. Named competitor: **Placeit ($14.95/mo, $89.69/yr annual)**; secondary: Smartmockups ($9–16/mo tiers), Canva Pro mockup features, Artboard Studio.

## Target communities

| Community | Angle (rules-aware) |
|---|---|
| r/SideProject | Straight "I built this" post is welcome — lead with the free/MIT source repo, mention the paid installer as the convenience option. "Needed launch-page mockups without another subscription" is the exact audience. |
| r/indiehackers / Indie Hackers forum | Build-in-public angle: the economics of one-time pricing vs Placeit's subscription, and the zero-asset-licensing trick (vector-defined scenes instead of stock photos). |
| r/EtsySellers / r/printondemand | Careful — no bare self-promo. Answer "how do you make listing mockups without Placeit?" threads helpfully; mention the tool only when asked for no-subscription options. The garment color-variant feature is the hook here. |
| r/webdev / r/reactjs (screenshots threads) | Comment value-first on "how do you present your portfolio/projects" threads; browser-window and device mockups angle. |
| r/opensource | Emphasize the interesting technical bits: dependency-free raster engine, homography perspective warp in pure JS, hand-rolled PNG codec — MIT licensed. |
| Hacker News | Show HN (draft below) — HN will appreciate the "no stock photos, everything is a vector spec rendered by our own rasterizer" detail and the anti-subscription stance. |

## Show HN draft

**Title:** Show HN: Mockcraft – a desktop product mockup generator you buy once

**Body:**
Placeit charges $14.95/month to composite your image onto stock photos of devices and apparel — and the templates disappear when you stop paying. I wanted the 20% of that product I actually use (drop a screenshot on a phone/laptop/shirt, export a PNG for a landing page), running locally, owned outright. So I built Mockcraft.

The technically fun part: there are no bitmap assets in the app at all. Every scene — phones, laptops at an angle, a hoodie with drawstrings, a framed poster — is vector-defined in a spec file and rendered by a dependency-free RGBA raster engine written in plain JS: scanline polygon fill, anti-aliased rounded rects/ellipses, linear gradients, and a real perspective pipeline (solve the 8×8 homography for the placement quad, invert it, bilinear-sample the design per pixel, multiply-under shading so designs look printed into fabric rather than pasted on). The same engine runs in the Electron renderer for live preview and under bare Node for the test suite, which batch-renders all 12 templates to actual PNG files (also a from-scratch encoder — IHDR/IDAT/IEND, CRC32, zlib) and validates them.

Trade-off, stated honestly: scenes are stylized studio renders, not photographs of humans holding products. For clean device/apparel/print mockups it works great; if you need a smiling model at a coffee shop, Placeit's catalog is still the thing.

Source is MIT on GitHub. $19 packaged installer for people who don't want to `npm i` — pay once, own it forever.

## SEO keywords (10)

1. placeit alternative offline
2. mockup generator free desktop
3. product mockup tool no subscription
4. phone mockup maker
5. t-shirt mockup generator one time purchase
6. device mockup generator windows
7. laptop mockup maker offline
8. mockup generator without watermark
9. batch mockup generator
10. book cover mockup tool desktop

## AppSumo / PitchGround pitch

Mockcraft is the anti-subscription product mockup generator: a polished dark-mode desktop app that places any design onto 12 device/apparel/print scenes with a true perspective transform, swaps garment colors without re-placing the design, and batch-exports marketing-resolution PNGs across every template in a single pass — with zero bytes ever leaving the user's machine. The mockup category is one of SaaS's purest subscription taxes: Placeit charges $14.95/month for image compositing plus a rented template catalog, which makes a lifetime deal an easy sell — "Placeit costs $179/year; this is $19 once, and the MIT-licensed template pack is yours forever." No stock-photo licensing exists in the product (every scene is vector-generated), so there's no per-unit content cost and deep discount headroom for a launch campaign. MIT source doubles as trust and a technical differentiator (dependency-free raster engine with a pure-JS homography warp).

## Pricing math

- **Price: $19 one-time** (launch: $12)
- Placeit: $14.95/mo → Mockcraft **pays for itself in under 2 months**
- 1-year Placeit: $179.40 monthly / $89.69 annual (4.7–9.4x Mockcraft) · 3-year: $538.20 (28x Mockcraft)
- Anchor line for all copy: "Cheaper than 2 months of Placeit. Yours for life."
