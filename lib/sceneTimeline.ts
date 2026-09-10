/** Integer phases are settled compositions; transitions occupy the final 45% of each viewport. */
export const SCENE_IDS = ["arrival", "origin", "cut", "tolerance"] as const;
export const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function scenePhase(viewports: number) {
  const index = Math.floor(Math.max(0, viewports));
  return Math.min(4, index + smooth(0.55, 1, viewports - index));
}
export function copyOpacity(phase: number, index: number) {
  return 1 - smooth(0.08, 0.46, Math.abs(phase - index));
}

// Compensate for the lost vertical room without moving the copy into the stone.
// The mobile camera spans 5.1 world units horizontally; half the lost frame
// height is the extra downward offset needed for both mineral and terrain.
export function mobileStageOffset(width: number, height: number) {
  return width < 700 ? -Math.max(0, 740 - height) * 2.55 / width : 0;
}
