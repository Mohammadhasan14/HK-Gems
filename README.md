# HK GEMS

An interactive turquoise journey built with Next.js, React Three Fiber,
Three.js, Lenis and Zustand. The six reference states run through rough mineral,
carving, refinement and a silver-set cabochon.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The current Next.js version has its own agent
instructions and local documentation; read `AGENTS.md` before editing.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

Visual verification requires Playwright and Chrome. The script captures each
settled scene, then checks reverse scrolling, transition visibility, chapter
navigation, resizing, mobile widths and reduced motion. Supply the latest
reference image to generate comparisons normalized by width.

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
REFERENCE_IMAGE=/path/to/latest-reference.png \
node scripts/verify-journey.mjs
```

`BASE_URL` and `CHROME_PATH` can override their local defaults. Screenshots
and the check report are written to `artifacts/new-journey/`. These are individual
viewport captures because full-page screenshots repeat a fixed WebGL canvas.
Set `BROWSER_HEADED=1` to run either verification script in a visible Chrome
window with the machine's GPU when a desktop session is available.

`lib/journey.ts` defines the target copy and order. `lib/sceneTimeline.ts` owns
the phase mapping. See `MODELS.md` for assets, rendering and remaining realism
limitations. The generated material assets and their exact prompts are
documented in `public/materials/README.md`; no generation service is called
at runtime.

Verify actual wheel interpolation and save a forward/reverse video with
`node scripts/verify-scroll-motion.mjs` (the same Playwright and BASE_URL
variables apply). The recording and per-frame position report are saved beside
the scene screenshots.
