# HK GEMS

A six-scene turquoise journey built with Next.js, React Three Fiber, Three.js,
Lenis and Zustand. The approved narrative progresses from raw mineral through
carving and refinement to a polished stone and a silver ring.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Read `AGENTS.md` and the installed Next documentation
before editing this version of Next.js.

## Verification

```sh
npm run lint
npm run build -- --webpack
```

The browser script captures each settled scene at 1440 × 900, then checks all
six navigation stops, reverse scrolling, fast wheel gestures, copy handoffs,
resizing, narrow mobile viewports, reduced motion and the sticky-stage/footer
boundary. It requires Playwright and Chrome:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
BASE_URL=http://localhost:3000 \
BROWSER_HEADED=1 node scripts/verify-journey.mjs
```

`BROWSER_HEADED=1` uses a visible Chrome window and the machine's GPU when a
desktop session is available. Omit it for headless operation. `CHROME_PATH`
overrides the browser executable. `CAPTURE_ONLY=1` captures desktop scenes
and the footer during visual iteration, skipping navigation/mobile checks.

With the same environment variables, run `scripts/verify-scroll-motion.mjs`
to record actual wheel input through all scenes in both directions and check
intermediate positions, scene order, copy separation, and browser errors.
Software WebGL recording is not a hardware frame-rate benchmark.

`scripts/verify-ground.mjs` checks that terrain, slabs, pedestal, light directions
and camera stay fixed through intermediate forward/reverse scroll positions on
desktop and mobile, including reduced motion. It also compares ground pixels
with the mineral's shadow enabled and disabled to verify live shadow reception.
Use the same environment variables against a development server; its scene
inspection uses the React DevTools hook without adding production test globals.
Outputs default to `.tmp-verify/ground/`.

Captures, reports and the wheel recording go to `artifacts/refinement/`;
`OUTPUT_DIR` overrides the output location. The all-scenes sheet combines
individual viewport captures. A stitched full-page screenshot cannot reliably
represent a scroll-driven sticky canvas. Earlier captures remain under
`artifacts/new-journey/` for comparison.

`lib/journey.ts` defines content and navigation; `lib/sceneTimeline.ts` defines
the shared phase mapping. See `MODELS.md` for geometry, lighting, material
provenance and specific asset limitations.
