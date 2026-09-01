import * as THREE from "three";

/**
 * The master camera path. ONE curve drives camera position across the whole
 * scroll; a second curve drives the lookAt target. Both are sampled by a
 * single smoothed progress value in CameraRig (components/canvas/CameraRig.tsx)
 * — there is no per-beat camera. Beats (lib/beats.ts) are arclength ranges on
 * these curves, referenced by waypoint index. This is what makes seams
 * between beats structurally impossible: there is nothing to seam.
 *
 * getPointAt()/getTangentAt() use arc-length parametrization, so equal steps
 * in `t` correspond to equal *distance* traveled, keeping perceived speed
 * consistent regardless of how unevenly the waypoints below are spaced.
 *
 * This is a Phase 0 placeholder path — enough to prove the single-curve
 * architecture end to end. Phase 2 will densify the "cut" range (indices 3-5)
 * with additional close waypoints to author the "camera holds dead still for
 * the first three cuts, then enters the hull" choreography; right now it's a
 * smooth glide through that range.
 *
 * Near-plane note (failure mode #4 from the brief: mesh clipping at the end
 * of the page): waypoint 10 (collection end) is deliberately pulled far back
 * from any geometry, and the Canvas camera `near` is set very small
 * (see components/canvas/CanvasRoot.tsx) so waypoint 5 — which intentionally
 * sits *inside* the hero stone's bounding radius for the "enter the hull"
 * moment — doesn't clip.
 */

// prettier-ignore
const CAMERA_POSITION_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0.0,  1.2, 9.0),   // 0  arrival start — wide, elevated establishing shot
  new THREE.Vector3(0.6,  0.4, 5.5),   // 1  arrival end / origin start — stone off-centre, high key
  new THREE.Vector3(-0.8, -0.6, 3.8),  // 2  origin end / inhale start — descended past strata
  new THREE.Vector3(0.0, -0.1, 2.4),   // 3  inhale end / cut start — dust converges, camera re-centres
  new THREE.Vector3(0.0,  0.0, 1.6),   // 4  cut hold — camera dead-still while facets are cut (Phase 2 densifies this)
  new THREE.Vector3(0.0,  0.05, 0.15), // 5  cut end — inside the hull; near plane must be tiny here
  new THREE.Vector3(0.0,  0.2, 3.2),   // 6  tolerance end / object start — pulled back to the exploded diagram
  new THREE.Vector3(1.5,  0.3, 2.8),   // 7  object end / worn start — slow orbit around the finished ring
  new THREE.Vector3(0.0,  1.5, 4.5),   // 8  worn end / collection start — pulling back as the frame overexposes
  new THREE.Vector3(2.5,  2.0, 3.0),   // 9  collection mid — vitrine turntable, seen from slightly above
  new THREE.Vector3(0.0,  1.8, 7.5),   // 10 collection end — wide again, closing the loop back toward arrival
];

// prettier-ignore
const CAMERA_TARGET_WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(-0.4, 0.1, 0),  // 0
  new THREE.Vector3(-0.3, 0.0, 0),  // 1
  new THREE.Vector3(-0.1, -0.1, 0), // 2
  new THREE.Vector3(0.0, 0.0, 0),   // 3
  new THREE.Vector3(0.0, 0.0, 0),   // 4
  new THREE.Vector3(0.0, 0.0, 0),   // 5
  new THREE.Vector3(0.0, -0.1, 0),  // 6
  new THREE.Vector3(0.0, 0.0, 0),   // 7
  new THREE.Vector3(0.0, 0.2, 0),   // 8
  new THREE.Vector3(0.0, 0.4, 0),   // 9
  new THREE.Vector3(0.0, 0.3, 0),   // 10
];

export const cameraPositionCurve = new THREE.CatmullRomCurve3(
  CAMERA_POSITION_WAYPOINTS,
  false,
  "catmullrom",
  0.5,
);

export const cameraTargetCurve = new THREE.CatmullRomCurve3(
  CAMERA_TARGET_WAYPOINTS,
  false,
  "catmullrom",
  0.5,
);

export const CURVE_WAYPOINT_COUNT = CAMERA_POSITION_WAYPOINTS.length;
