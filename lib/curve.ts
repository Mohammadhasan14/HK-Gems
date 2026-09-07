import * as THREE from "three";
import { BEATS } from "./beats";

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
 *
 * Camera pacing note: getPointAt is uniform-arclength BY DEFINITION — equal
 * steps in the input t always cover equal *distance*, everywhere on the
 * curve, no matter how waypoints are spaced. That means waypoint spacing
 * alone can never make the camera "hold still" for a stretch of scroll (a
 * genuinely zero-length cluster of waypoints would only compress that hold
 * into a vanishingly small slice of t, i.e. a snap, not a dwell). The "cut"
 * beat's hold-then-push choreography is instead authored by warpProgress()
 * below, which reshapes how progress maps to t only inside that beat's own
 * range — the curve's waypoints stay a uniform-speed path end to end; what
 * changes is how much of the beat's scroll is spent on which fraction of
 * that path.
 */

// prettier-ignore
const CAMERA_POSITION_WAYPOINTS: THREE.Vector3[] = [
  // Waypoints 0-4 frame the ROUGH, which is markedly bigger than the finished
  // gem (lib/rawStone.ts's RAW_SCALE against lib/gemGeometry.ts's CUT_SCALE)
  // because cutting removes material, so they sit further out; 6-10 frame the
  // finished gem and sit closer. That difference is the point rather than an
  // inconsistency: the camera holds the SUBJECT at a roughly constant size in
  // frame while the stone itself gets smaller, which is what sells the cut as
  // having taken something away.
  //
  // Two things are load-bearing about the hero pair specifically. The targets
  // below sit LEFT of and BELOW the stone's centre, throwing it right-of-frame
  // and a little high, which leaves the left third clear for the headline
  // column. And the ELEVATION matters as much as the distance: too low and the
  // crown faces away from both the key light and the bright half of the
  // environment, so every crown facet renders the same value and the cut stops
  // reading as structure.
  new THREE.Vector3(0.55, 1.85, 6.5),  // 0  arrival start — elevated establishing shot
  new THREE.Vector3(1.15, 0.8, 5.6),   // 1  arrival end / origin start — closer, intimate, off-centre
  new THREE.Vector3(-1.5, -1.0, 6.6),  // 2  origin end / inhale start — descended past strata
  new THREE.Vector3(0.0, -0.15, 5.2),  // 3  inhale end / cut start — dust converges, camera re-centres
  new THREE.Vector3(0.5, 0.55, 5.0),   // 4  cut hold — held off one shoulder while facets are ground in
  // 5 cut end — a MACRO on the finished crown, deliberately still outside the
  // stone. The camera used to push inside the hull here, which worked when
  // the stone was clear quartz and reading its interior was the point; with
  // an opaque turquoise there is nothing to see in there but backfaces, and
  // it read as a rendering fault rather than a reveal. Close enough that the
  // facets fill the frame is the version of that shot that still lands.
  new THREE.Vector3(0.8, 0.45, 2.3),
  new THREE.Vector3(0.0,  0.2, 2.7),   // 6  tolerance end / object start — pulled back to the exploded diagram
  new THREE.Vector3(1.3,  0.28, 2.4),  // 7  object end / worn start — slow orbit around the finished ring
  new THREE.Vector3(0.0,  1.3, 3.9),   // 8  worn end / collection start — pulling back as the frame overexposes
  new THREE.Vector3(2.5,  2.0, 3.0),   // 9  collection mid — vitrine turntable, seen from slightly above
  new THREE.Vector3(0.0,  1.8, 7.5),   // 10 collection end — wide again, closing the loop back toward arrival
];

// prettier-ignore
const CAMERA_TARGET_WAYPOINTS: THREE.Vector3[] = [
  // The brilliant's mass hangs below its girdle, so its visual centre is
  // ~y -0.28, not 0. Aiming a little under that lifts the stone above the
  // frame's midline rather than letting it sit low and bottom-heavy.
  new THREE.Vector3(-0.60, -0.12, 0), // 0
  new THREE.Vector3(-0.44, -0.16, 0), // 1
  new THREE.Vector3(-0.1, -0.1, 0),   // 2
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

const CUT = BEATS.find((b) => b.id === "cut")!;

/**
 * Where the camera path makes its closest approach to the stone during the
 * Cut — the macro shot the beat pushes toward. A MID-curve minimum, not an
 * endpoint: the remainder of Cut is already spent swinging back out toward
 * Tolerance's waypoint, and that return glide is part of the curve's own
 * shape, not something warpProgress needs to touch. Computed once at module
 * load (500 samples is trivial) rather than hardcoded, so it stays correct
 * if the waypoints above are ever retuned.
 */
const CLOSEST_APPROACH_T = (() => {
  const SAMPLES = 500;
  const p = new THREE.Vector3();
  let bestT = CUT.start;
  let bestDist = Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const t = CUT.start + (i / SAMPLES) * (CUT.end - CUT.start);
    cameraPositionCurve.getPointAt(t, p);
    const d = p.length();
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  return bestT;
})();
const DIP_LOCAL = (CLOSEST_APPROACH_T - CUT.start) / (CUT.end - CUT.start);

// Fraction of the *approach* sub-phase (cut-start -> closest-approach, i.e. local
// progress 0..DIP_LOCAL) spent "holding" before pushing toward the hull.
const HOLD_FRACTION = 0.62;
// Fraction of the curve distance between cut-start and closest-approach covered
// during that hold — small on purpose, so the push reads as a clear rush.
const HOLD_COVERAGE = 0.1;

/**
 * Remaps global scroll progress to the t actually fed into getPointAt.
 * Identity everywhere except inside the Cut beat's own [start, end] range
 * (continuous at both edges, so there's no visible pop entering/leaving the
 * beat). Two sub-phases inside Cut:
 *   - approach (local 0..DIP_LOCAL): hold for HOLD_FRACTION of this
 *     sub-range while covering only HOLD_COVERAGE of the cut-start ->
 *     closest-approach distance, then rush the remainder — see the pacing note
 *     above cameraPositionCurve for why this needs a t-remap at all.
 *   - recovery (local DIP_LOCAL..1): identity/proportional pass-through
 *     onto the closest-approach -> cut-end range — the swing back out is already
 *     paced correctly by the raw curve, nothing to warp there.
 */
export function warpProgress(progress: number): number {
  if (progress <= CUT.start || progress >= CUT.end) return progress;

  const local = (progress - CUT.start) / (CUT.end - CUT.start);

  if (local <= DIP_LOCAL) {
    const subLocal = local / DIP_LOCAL;
    const mappedSubLocal =
      subLocal <= HOLD_FRACTION
        ? HOLD_COVERAGE * (subLocal / HOLD_FRACTION)
        : HOLD_COVERAGE +
          (1 - HOLD_COVERAGE) * ((subLocal - HOLD_FRACTION) / (1 - HOLD_FRACTION));
    return CUT.start + mappedSubLocal * (CLOSEST_APPROACH_T - CUT.start);
  }

  const subLocal2 = (local - DIP_LOCAL) / (1 - DIP_LOCAL);
  return CLOSEST_APPROACH_T + subLocal2 * (CUT.end - CLOSEST_APPROACH_T);
}
