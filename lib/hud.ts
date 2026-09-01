/**
 * Non-reactive side channel for high-frequency dev-HUD values (camera
 * position, FPS, the quality probe's result). These are written every frame
 * by CameraRig and QualityController; routing them through the Zustand
 * scroll store would re-render every store subscriber at 60fps for no
 * reason, since only the hidden-by-default DevHud ever reads them, and only
 * while visible.
 */
export const hud = {
  cameraPosition: { x: 0, y: 0, z: 0 },
  /** Live rolling FPS — always updating, independent of the probe below. */
  fps: 0,
  /**
   * What components/dom/QualityController.tsx's one-shot demotion probe
   * actually measured. Null until the probe finishes (or forever, if it was
   * skipped because ?quality= or STATIC already applied). Shown verbatim in
   * the dev HUD so "why did this demote" never requires reading source.
   */
  qualityProbe: null as null | {
    avgFps: number;
    sampledFrames: number;
    thresholdFps: number;
    /** Whether the measured avgFps was under thresholdFps — independent of whether that actually caused a demotion. */
    belowThreshold: boolean;
    /** Whether this measurement actually changed the tier. Can be false even when belowThreshold, if an override held it. */
    demoted: boolean;
  },
};
