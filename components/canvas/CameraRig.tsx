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

/**
 * The one camera rig. Position and lookAt both come from lib/curve.ts,
 * sampled at a single smoothed progress value — no per-beat camera exists.
 */
export function CameraRig() {
  const { camera } = useThree();
  const smoothedProgress = useRef(0);

  useFrame((_state, delta) => {
    const { progress, velocity } = useScroll.getState();

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

    camera.position.copy(_pos);
    camera.lookAt(_target);

    hud.cameraPosition.x = camera.position.x;
    hud.cameraPosition.y = camera.position.y;
    hud.cameraPosition.z = camera.position.z;
  });

  return null;
}
