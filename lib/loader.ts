/**
 * Non-reactive bridge between the DOM loader (components/dom/Loader.tsx) and
 * the 3D light-point (components/canvas/LightPoint.tsx), so the two can hand
 * off as one continuous object instead of crossfading between a DOM element
 * and a WebGL one.
 *
 * components/canvas/LightPoint.tsx writes its own screen-space projection
 * here every frame; components/dom/Loader.tsx reads it once, at the exact
 * moment the counter starts collapsing, so the DOM digits shrink toward the
 * precise pixel the 3D point already occupies — then ramps `progress` 0->1
 * over that same collapse so the WebGL point brightens in sync as the DOM
 * element disappears into it.
 */
export const loaderBridge = {
  screenX: 0,
  screenY: 0,
  /** True once LightPoint has rendered at least one frame and screenX/Y are meaningful. */
  ready: false,
  /** 0 = not yet handed off, 1 = fully handed off. Written by the DOM loader's collapse tween. */
  progress: 0,
};
