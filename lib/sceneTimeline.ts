import { SCENES } from "./journey";
export const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Each native section has a readable hold, then a reversible transition.
 * No pin spacers, independent animation clocks, or legacy camera ranges. */
export function scenePhase(viewports: number, reducedMotion = false) {
  const p = Math.max(0, Math.min(SCENES.length - 1, viewports));
  const index = Math.floor(p);
  return reducedMotion ? Math.min(5, Math.floor(p + .2))
    : index + smooth(.28, 1, p - index);
}
export function copyOpacity(phase: number, index: number) {
  return 1 - smooth(.06, .43, Math.abs(phase - index));
}
/** Pixel-based mobile staging leaves the upper copy area unobstructed. */
export function stagePlacement(width: number, height: number, phase = 0) {
  const mobile = width < 700;
  const worldWidth = mobile ? 5.2 : 10;
  const viewHeight = worldWidth * height / width;
  return { mobile, worldWidth, viewHeight,
    centerY: mobile ? viewHeight * (.5 - (.70 - Math.min(1, phase) * .05)) : -.02,
    scale: mobile ? Math.max(.88, Math.min(1, height / 850)) : 1.15,
  };
}
