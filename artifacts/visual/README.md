# Visual verification

The reference is HERITAGE ATELIER (`codex-clipboard-Hbo5Tq.png`). The supplied
long HK GEMS screenshot was the previous implementation, not the target.

- `arrival.png`, `origin.png`, `cut.png`, `tolerance.png`: separate 887 × 500
  desktop captures at the four settled section offsets.
- `comparison-*.png`: reference at left, implementation at right. Both use
  an 887px-wide image. The shorter reference panels are letterboxed to 500px,
  preserving their aspect ratio rather than stretching the screenshot.
- `comparison-all.png`: the four comparisons in one contact sheet.
- `mobile-*.png`: 390 × 844 captures.
- `mobile-short.png`: the Cut at 360 × 640.
- `mobile-compact.png`: the Cut at 320 × 568. Both short-screen sizes received
  a final visual follow-up after lowering the mineral and terrain together.
- `desktop-wide.png`: hero at 1440 × 900.
- `verification.json`: canvas/rail counts, copy visibility, overflow and
  browser errors from the automated browser checks.

The script also exercises chapter navigation backward, intermediate scroll
positions, sound on/off, the existing later chapters, viewport resizing,
and reduced-motion mode. Full-page captures are intentionally not used:
a single fixed canvas is a live viewport, not an image for each DOM section.

Reproduce with an installed Playwright package and Chrome:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
CHROME_PATH=/path/to/chrome \
REFERENCE_IMAGE=/path/to/reference.png \
node scripts/verify-journey.mjs
```

The code uses sculpted procedural geometry and baked mineral textures. The
reference has finer mineral relief, more specific gold veining, glassier
cut facets and more photographic terrain/light scattering. The comparisons
are evidence of the composition work, not a claim of an exact reproduction.
