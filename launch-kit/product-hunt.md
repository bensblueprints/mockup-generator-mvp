# Product Hunt Launch — Mockcraft

## Name
Mockcraft

## Tagline (60 chars)
Product mockups on your desktop. Pay once, own it forever.

## Description (260 chars)
Mockcraft is a local-first desktop mockup generator: drop a design onto phone/laptop/apparel/print scenes with true perspective placement, swap garment colors, and batch-export across every template in one pass. $19 once instead of $14.95/month. No cloud.

## Full description

Mockcraft is a desktop product mockup generator for people who are tired of paying a monthly fee to drag their image onto a picture of a phone.

**Why another mockup tool?** Because Placeit charges $14.95/month — forever — for what is fundamentally an image-compositing task your own machine can do offline. Mockcraft is $19 once, MIT-licensed, and runs entirely locally.

**What it actually does:**
- 12 bundled templates across devices (phone/laptop/tablet/browser, front + angled), apparel (t-shirt, hoodie), and print (business card, framed poster, book cover, transparent sticker)
- True perspective placement: angled scenes use a full homography transform, so your screenshot sits on the tilted screen like it was photographed there
- Scale / offset / rotation sliders with cover, contain, and stretch fit modes, live-previewed
- Garment color variants: 8 swatches recolor the shirt or hoodie instantly, with your design multiply-shaded into the fabric so it looks printed, not pasted
- Batch mode: check any set of templates, export your design across all of them in one pass
- Marketing-resolution PNG export (1600–1920px scenes), true alpha on transparent templates

No account. No telemetry. No network calls. No upload. Pay once. Own it forever.

## Maker first comment

Hey PH 👋

I got tired of paying $14.95/month to put my app screenshots on a phone. That's the entire product — your image, composited onto a scene — rented monthly, forever, with the templates disappearing the moment you stop paying. So I built Mockcraft: a local desktop app, one-time $19, that does the mockup workflow I actually use — drop a design, place it (with a real perspective transform on angled scenes, not a skew), and batch-export it across a dozen templates for a launch page in one pass.

A technical detail I'm fond of: there are zero stock photos in the app. Every scene is vector-defined in a JSON-ish spec and rendered by a dependency-free raster engine (scanline polygon fill, anti-aliased shapes, an 8×8 homography solve with bilinear sampling for the perspective warp). That means the whole template pack ships MIT-licensed with the source, renders at any resolution, and adding a template is adding one object to a spec file — no image licensing, no asset downloads.

Being upfront: the scenes are stylized studio renders, not photographs of real hands holding real phones. If you need a smiling stock model, Placeit still has the catalog. If you need clean, sharp device/apparel/print mockups for a landing page, store listing, or portfolio — that's exactly what this is for.

$19 once. Would love feedback, especially on which templates to add next.

## Gallery shots (5)

1. **Hero — the editor**: dark UI, a colorful app screenshot placed on the angled-laptop scene, template gallery down the left, placement sliders on the right. Caption: "Drop a design. Get a mockup."
2. **Perspective placement**: close crop of the angled phone scene showing the design following the screen's tilt convincingly. Caption: "True perspective, not a skew."
3. **Garment color variants**: the same logo on four t-shirt colors (white/black/navy/red) side by side, swatch row visible. Caption: "One design, every garment color — no re-placing."
4. **Batch export**: the batch panel with 8 templates checked and a folder of freshly exported PNGs in Explorer next to it. Caption: "Your whole launch page's mockups in one pass."
5. **Price comparison card**: "Placeit: $538 over 3 years vs Mockcraft: $19 once" side by side. Caption: "Your mockups are not a subscription."
