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
  // Keep copy legible through most of the transformation. A short, separate
  // handoff avoids long half-visible paragraphs and never overlaps two scenes.
  return 1 - smooth(.37, .49, Math.abs(phase - index));
}
/** Pixel-based mobile staging leaves the upper copy area unobstructed. */
export function stagePlacement(width: number, height: number, phase = 0) {
  const mobile = width < 700;
  const worldWidth = mobile ? 5.6 : 10;
  const viewHeight = worldWidth * height / width;
  return { mobile, worldWidth, viewHeight,
    centerY: mobile ? viewHeight * (.5 - (.70 + smooth(0,1,phase)*.015 - smooth(4,5,phase)*.03)) : -.02,
    scale: mobile ? Math.max(.85, Math.min(1.08, height / 780)) : 1.06,
  };
}
