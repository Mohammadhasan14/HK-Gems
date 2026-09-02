import * as THREE from "three";

/**
 * Procedural placeholder for the hero stone's 5-stage cut sequence (Beat 3 —
 * "The Cut"). MODELS.md's delivery format is a sequence of pre-authored
 * "cut stage" BufferGeometrys, NOT runtime CSG — CSG can't be scrubbed
 * against scroll position, since each stage would need to be solved live,
 * every frame, at whatever fractional cut the scrollbar happens to be at.
 * This generates that sequence by slicing a convex hull with planes, once,
 * at module load — never per frame — so what's actually scrubbed against
 * scroll is a discrete pick from N precomputed geometries (see
 * components/canvas/HeroStone.tsx), exactly like the real modeller-authored
 * stages will be swapped once they land.
 *
 * Each stage cumulatively slices more planes off the PREVIOUS stage's
 * result. Intersecting a convex polyhedron with a half-space always yields
 * another convex polyhedron — that's what makes the capping algorithm below
 * safe without a general polygon-with-holes triangulator: the cut boundary
 * for one plane through one convex shape is always a single simple loop, so
 * it can be closed by sorting its points by angle around their centroid.
 */

const EPS = 1e-6;

/** Cuts away the side of `geometry` where distanceToPoint(v) > 0, capping the resulting hole. */
function cutConvexGeometry(
  geometry: THREE.BufferGeometry,
  plane: THREE.Plane,
): THREE.BufferGeometry {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const keptTriangles: THREE.Vector3[] = [];
  const boundaryPoints: THREE.Vector3[] = [];

  function distanceOf(v: THREE.Vector3) {
    return plane.distanceToPoint(v);
  }

  // Sutherland-Hodgman clip of one triangle against the plane, keeping the
  // side where distance <= 0. A triangle clipped by one plane yields 0, 1
  // (unclipped), or a convex tri/quad — never more than 4 points.
  function clipTriangle(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3) {
    const pts = [p0, p1, p2];
    const dist = pts.map(distanceOf);
    const inside = dist.map((d) => d <= EPS);

    if (inside.every(Boolean)) {
      keptTriangles.push(p0.clone(), p1.clone(), p2.clone());
      return;
    }
    if (inside.every((v) => !v)) return; // fully on the removed side

    const outPoly: THREE.Vector3[] = [];
    for (let i = 0; i < 3; i++) {
      const cur = pts[i];
      const next = pts[(i + 1) % 3];
      const curIn = inside[i];
      const nextIn = inside[(i + 1) % 3];

      if (curIn) outPoly.push(cur.clone());
      if (curIn !== nextIn) {
        const dCur = dist[i];
        const dNext = dist[(i + 1) % 3];
        const t = dCur / (dCur - dNext);
        const ip = cur.clone().lerp(next, t);
        outPoly.push(ip);
        boundaryPoints.push(ip.clone());
      }
    }
    for (let i = 1; i < outPoly.length - 1; i++) {
      keptTriangles.push(outPoly[0], outPoly[i], outPoly[i + 1]);
    }
  }

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    clipTriangle(a, b, c);
  }

  // Cap the hole. Dedupe near-identical crossing points (shared triangle
  // edges produce the same intersection point twice), then order the
  // remaining single loop by angle around its centroid in the plane's own
  // 2D basis (u, v, normal — right-handed, so increasing angle is
  // counter-clockwise as seen from the +normal side) and fan-triangulate.
  const unique: THREE.Vector3[] = [];
  for (const p of boundaryPoints) {
    if (!unique.some((u) => u.distanceToSquared(p) < 1e-8)) unique.push(p);
  }

  if (unique.length >= 3) {
    const centroid = unique
      .reduce((sum, p) => sum.add(p), new THREE.Vector3())
      .divideScalar(unique.length);
    const normal = plane.normal;
    const u = new THREE.Vector3()
      .crossVectors(
        normal,
        Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0),
      )
      .normalize();
    const v = new THREE.Vector3().crossVectors(normal, u);

    unique.sort((p1, p2) => {
      const d1 = p1.clone().sub(centroid);
      const d2 = p2.clone().sub(centroid);
      return Math.atan2(v.dot(d1), u.dot(d1)) - Math.atan2(v.dot(d2), u.dot(d2));
    });

    // (centroid, p[i], p[i+1]) in increasing-angle order winds
    // counter-clockwise as seen from +normal, so its face normal points
    // along +normal — outward, away from the kept (negative-distance) side.
    for (let i = 0; i < unique.length; i++) {
      const p1 = unique[i];
      const p2 = unique[(i + 1) % unique.length];
      keptTriangles.push(centroid.clone(), p1.clone(), p2.clone());
    }
  }

  const out = new THREE.BufferGeometry();
  const flat = new Float32Array(keptTriangles.length * 3);
  keptTriangles.forEach((p, i) => p.toArray(flat, i * 3));
  out.setAttribute("position", new THREE.BufferAttribute(flat, 3));
  out.computeVertexNormals();
  return out;
}

function plane(normal: [number, number, number], constant: number): THREE.Plane {
  return new THREE.Plane(new THREE.Vector3(...normal).normalize(), constant);
}

// Cumulative cut plan per stage, applied to the running geometry in order.
// A plane (n, k) removes everything where n·v + k > 0, so k is roughly
// "how far out the cut sits" — smaller |k| cuts deeper.
const STAGE_PLANES: THREE.Plane[][] = [
  [], // stage 0: rough hull — the base icosahedron, uncut
  [plane([0, 1, 0], -0.62)], // stage 1: table facet — one flat cut at the top
  [
    // stage 2: crown facets — four bevels around the upper hemisphere
    plane([0.55, 0.7, 0], -0.58),
    plane([-0.55, 0.7, 0], -0.58),
    plane([0, 0.7, 0.55], -0.58),
    plane([0, 0.7, -0.55], -0.58),
  ],
  [
    // stage 3: pavilion facets — four bevels around the lower hemisphere,
    // offset in azimuth from the crown cuts so the two sets read as distinct
    plane([0.6, -0.65, 0.2], -0.55),
    plane([-0.6, -0.65, 0.2], -0.55),
    plane([0.2, -0.65, -0.6], -0.55),
    plane([-0.2, -0.65, -0.6], -0.55),
  ],
  [
    // stage 4: final polish — shallow girdle bevels, rounding the last sharp
    // edges. Diagonal (not axis-aligned) normals: a unit icosahedron's
    // vertices never exceed |x|=0.85 on any single axis, so axis-aligned
    // planes at this depth would never actually intersect the hull.
    plane([1, 0, 1], -0.86),
    plane([-1, 0, 1], -0.86),
    plane([1, 0, -1], -0.86),
    plane([-1, 0, -1], -0.86),
  ],
];

function buildStages(): THREE.BufferGeometry[] {
  const base = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  const stages: THREE.BufferGeometry[] = [base];
  let current: THREE.BufferGeometry = base;
  for (let s = 1; s < STAGE_PLANES.length; s++) {
    for (const p of STAGE_PLANES[s]) {
      current = cutConvexGeometry(current, p);
    }
    stages.push(current);
  }
  return stages;
}

export const CUT_STAGES = buildStages();
export const CUT_STAGE_COUNT = CUT_STAGES.length;
