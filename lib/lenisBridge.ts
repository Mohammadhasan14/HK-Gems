import Lenis from "lenis";
let instance: Lenis | null = null;
export function getLenis() {
  if (!instance) instance = new Lenis({ duration: .85, smoothWheel: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  return instance;
}
export function scrollToScene(anchor: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  getLenis().scrollTo(anchor, { duration: .85, immediate: reduce });
}
export function destroyLenis() { instance?.destroy(); instance = null; }
