/**
 * Non-reactive side channel for high-frequency dev-HUD values (camera
 * position, FPS). These are written every frame by CameraRig and
 * QualityController; routing them through the Zustand scroll store would
 * re-render every store subscriber at 60fps for no reason, since only the
 * hidden-by-default DevHud ever reads them, and only while visible.
 */
export const hud = {
  cameraPosition: { x: 0, y: 0, z: 0 },
  fps: 0,
};
