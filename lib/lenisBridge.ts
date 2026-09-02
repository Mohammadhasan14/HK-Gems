import Lenis from "lenis";

let instance: Lenis | null = null;

/**
 * Lazily creates (on first call) and returns the single Lenis instance for
 * the whole site. Deliberately NOT tied to any one component's mount
 * timing: components/dom/ScrollProvider.tsx (which wires the scroll->store
 * listener and the shared gsap.ticker clock) and components/dom/Loader.tsx
 * (which may need to stop scroll before ScrollProvider's own effect has run
 * — Loader is a child of ScrollProvider, and child effects fire before
 * parent effects on mount) both call this directly instead of racing to be
 * "the one that creates it". Whichever runs first creates it; the other
 * reuses the same instance.
 *
 * Client-only — `new Lenis()` touches `window`, so this must only ever be
 * called from inside an effect, never during render (client components are
 * still rendered once on the server for the initial HTML).
 */
export function getLenis(): Lenis {
  if (!instance) {
    instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
  }
  return instance;
}

export function destroyLenis() {
  instance?.destroy();
  instance = null;
}
