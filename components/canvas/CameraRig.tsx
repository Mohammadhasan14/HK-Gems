"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { cameraPositionCurve, cameraTargetCurve, warpProgress } from "@/lib/curve";
import { hud } from "@/lib/hud";

// Scratch vectors reused every frame — avoid allocating inside useFrame.
const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

// The aspect the curve's waypoints were framed against (a normal desktop
// window). At or above this, framing is used exactly as authored.
const REFERENCE_ASPECT = 1.7;
// Never pull back further than this, or a phone would view the stone from
// so far that it stops being the subject.
const MAX_FIT_DOLLY = 2.1;

/**
 * How far to dolly the camera back to keep the same subject in frame at a
 * narrower aspect. A perspective camera's vertical FOV is fixed, so as the
 * viewport narrows the horizontal field collapses and an object framed for
 * a wide window overflows the sides — on a phone the stone filled the frame
 * edge to edge and ran straight through the headline. Scaling distance by
 * the aspect shortfall restores the authored composition instead of
 * letting the layout crop it.
 *
 * Exactly 1 (a no-op) at desktop aspects, so this cannot change how any
 * beat is framed on the screens the curve was authored against.
 */
function fitDolly(aspect: number): number {
  if (aspect >= REFERENCE_ASPECT) return 1;
  return Math.min(MAX_FIT_DOLLY, REFERENCE_ASPECT / Math.max(aspect, 0.3));
}

/**
 * The one camera rig. Position and lookAt both come from lib/curve.ts,
 * sampled at a single smoothed progress value — no per-beat camera exists.
 */
export function CameraRig() {
  const { size } = useThree();
  const smoothedProgress = useRef(0);

  useFrame((_state, delta) => {
    const camera = _state.camera as THREE.PerspectiveCamera;
    const { progress, velocity, scene } = useScroll.getState();
    if (scene < 4) {
      const mobile = size.width < 700;
      const viewWidth = mobile ? 5.1 : 10.5;
      const distance = 9.2;
      const perspective = camera as THREE.PerspectiveCamera;
      perspective.fov = THREE.MathUtils.radToDeg(2 * Math.atan((viewWidth / (size.width / size.height)) / (2 * distance)));
      camera.position.set(0, 1.35, distance);
      camera.lookAt(0, 0, 0);
      perspective.updateProjectionMatrix();
      return;
    }
    (camera as THREE.PerspectiveCamera).fov = 35;
    camera.updateProjectionMatrix();

    // Smooth the raw scroll progress so camera motion lags the wheel (the
    // "scrub ~1" feel from the brief) rather than snapping to it 1:1. This is
    // decoupled from Lenis's own lerp so camera weight can be retuned
    // independently of scroll feel.
    smoothedProgress.current +=
      (progress - smoothedProgress.current) * Math.min(1, delta * 4);

    const rawT = THREE.MathUtils.clamp(smoothedProgress.current, 0, 1);
    // See lib/curve.ts's pacing note: this is what actually produces the
    // Cut beat's "hold, then push into the hull" read — waypoint spacing
    // alone can't, since getPointAt is uniform-arclength everywhere.
    const t = warpProgress(rawT);

    cameraPositionCurve.getPointAt(t, _pos);
    cameraTargetCurve.getPointAt(t, _target);

    // Fast scroll banks the camera slightly along the curve's local normal —
    // a small lateral offset proportional to velocity, so quick scrolling
    // reads as a bank rather than a pure dolly. Clamped so it never gets wild.
    cameraPositionCurve.getTangentAt(t, _tangent);
    _normal.crossVectors(_tangent, _up).normalize();
    const bank = THREE.MathUtils.clamp(velocity * 0.02, -0.4, 0.4);
    _pos.addScaledVector(_normal, bank);

    // Responsive fit: dolly back along the view axis on narrow viewports so
    // the authored composition survives a phone. Applied about the lookAt
    // target, so the camera keeps pointing at exactly the same thing — only
    // its distance changes, never the angle or the story.
    const aspect = size.width / Math.max(size.height, 1);
    const dolly = fitDolly(aspect);
    if (dolly !== 1) {
      // The waypoints aim off to one side so the stone sits right-of-frame
      // with the headline beside it. A phone has no side column — the copy
      // stacks above the stone instead — so that same offset just pushes the
      // subject off the edge. Ease the aim back to centre as the viewport
      // narrows, which is the composition actually adapting rather than the
      // desktop one being cropped.
      const narrowness = THREE.MathUtils.clamp(
        (REFERENCE_ASPECT - aspect) / (REFERENCE_ASPECT - 0.55),
        0,
        1,
      );
      _target.x = THREE.MathUtils.lerp(_target.x, 0, narrowness);
      _pos.sub(_target).multiplyScalar(dolly).add(_target);
    }

    camera.position.copy(_pos);
    camera.lookAt(_target);

    hud.cameraPosition.x = camera.position.x;
    hud.cameraPosition.y = camera.position.y;
    hud.cameraPosition.z = camera.position.z;
  });

  return null;
}
