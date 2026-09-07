import * as THREE from "three";
import { GEM_FACET_PLANES, GEM_MAX_EXTENT, type FacetPlane } from "./gemGeometry";
import {
  GEM_BASE_DIRECTIONS,
  GEM_BASE_SPHERE,
  RAW_MIN_RADIUS,
  rawRadius,
} from "./rawStone";

/**
 * Beat 3, "The Cut" — the rough being cut into the finished gem.
 *
 * This is a real carve, not a crossfade between two models. Stage 0 IS
 * lib/rawStone.ts's specimen; each later stage is that same specimen with
 * more of lib/gemGeometry.ts's facet planes ground into it; the last stage
 * is the finished brilliant. Because material only ever comes off, the beat
 * says what the copy on screen says — "Nothing is added. Only what does not
 * belong is taken away."
 *
 * How the carve works: both the rough and the cut are defined radially, so
 * the stone's surface in a direction `u` is simply the NEAREST limit acting
 * in that direction — the rough's own radius, or `d / (n · u)` for each
 * facet plane facing that way. Taking the minimum carves the rough with the
 * cut exactly, needs no polygon clipping, and — because every stage reuses
 * one base sphere's vertices and UVs — produces stages with identical
 * topology. That last part is what makes the sequence scrub cleanly: moving
 * between stages moves the surface, and cannot pop the mesh.
 *
 * The planes are ground in group by group, in the order a cutter actually
 * works: table first, then the crown, then the girdle, then the pavilion.
 * Within a group each plane sweeps inward from outside the stone to its
 * final depth, so a facet visibly grows rather than appearing whole.
 */

/** Stage 0 is the untouched rough; the rest carve progressively. */
const STAGE_COUNT = 9;

/** A plane this far out clears the rough entirely, so it removes nothing. */
const INACTIVE_DISTANCE = 10;

/**
 * The cut has to fit inside the rough — a cutter cannot add material. This
 * is the check for that, run once at module load rather than assumed: the
 * finished gem's furthest point must sit inside the rough's tightest
 * direction. If a future edit to either shape breaks it, this fails loudly
 * here instead of silently rendering a gem poking out through its own rough.
 */
if (RAW_MIN_RADIUS <= GEM_MAX_EXTENT) {
  throw new Error(
    `Cut does not fit inside the rough: rough min radius ${RAW_MIN_RADIUS.toFixed(3)} <= cut extent ${GEM_MAX_EXTENT.toFixed(3)}. Raise RAW_SCALE in lib/rawStone.ts.`,
  );
}

/**
 * Facet groups in cutting order. Classified by how far each plane's normal
 * tilts from vertical, which is exactly what distinguishes the groups on a
 * brilliant: the table faces straight up, crown facets tilt up and out,
 * girdle facets face outward, pavilion facets tilt down and out.
 */
const GROUPS: FacetPlane[][] = (() => {
  const table: FacetPlane[] = [];
  const crown: FacetPlane[] = [];
  const girdle: FacetPlane[] = [];
  const pavilion: FacetPlane[] = [];
  for (const p of GEM_FACET_PLANES) {
    const ny = p.normal.y;
    if (ny > 0.95) table.push(p);
    else if (ny > 0.2) crown.push(p);
    else if (ny > -0.2) girdle.push(p);
    else pavilion.push(p);
  }
  return [table, crown, girdle, pavilion];
})();

/**
 * Effective distance of every plane at a given overall cut progress. Each
 * group owns an equal slice of the progression and eases in across it; a
 * group that has not started yet sits at INACTIVE_DISTANCE and does nothing.
 */
function planeDistancesAt(progress: number): number[] {
  const span = 1 / GROUPS.length;
  const distances: number[] = [];
  GROUPS.forEach((group, groupIndex) => {
    const local = THREE.MathUtils.clamp((progress - groupIndex * span) / span, 0, 1);
    const eased = THREE.MathUtils.smoothstep(local, 0, 1);
    for (const plane of group) {
      distances.push(THREE.MathUtils.lerp(INACTIVE_DISTANCE, plane.distance, eased));
    }
  });
  return distances;
}

/** Planes flattened into the same order planeDistancesAt returns. */
const ORDERED_PLANES: FacetPlane[] = GROUPS.flat();

/**
 * Builds one stage. Returns a non-indexed geometry whose normals are
 * per-facet where the surface has been cut and smooth where it is still
 * rough — so a half-cut stone reads correctly as both at once, crisp facets
 * meeting an unworked natural surface, rather than being uniformly faceted
 * (which would make the rough look low-poly) or uniformly smooth (which
 * would round off the facets the beat exists to show).
 */
function buildStage(progress: number): THREE.BufferGeometry {
  const distances = planeDistancesAt(progress);

  const indexed = GEM_BASE_SPHERE.clone();
  const pos = indexed.attributes.position as THREE.BufferAttribute;
  // Which plane ended up limiting each vertex, or -1 if the vertex is still
  // on unworked rough. This is the key to shading the result correctly —
  // see below.
  const carvedBy: number[] = new Array(pos.count);

  for (let i = 0; i < pos.count; i++) {
    const dir = GEM_BASE_DIRECTIONS[i];
    let radius = rawRadius(dir);
    let limitedBy = -1;

    for (let p = 0; p < ORDERED_PLANES.length; p++) {
      const facing = ORDERED_PLANES[p].normal.dot(dir);
      if (facing <= 1e-4) continue; // plane faces away; cannot limit this ray
      const limit = distances[p] / facing;
      if (limit < radius) {
        radius = limit;
        limitedBy = p;
      }
    }

    carvedBy[i] = limitedBy;
    pos.setXYZ(i, dir.x * radius, dir.y * radius, dir.z * radius);
  }
  pos.needsUpdate = true;
  // Smooth normals first — these are the ones the still-rough regions keep.
  indexed.computeVertexNormals();

  const geometry = indexed.toNonIndexed();
  const gNormal = geometry.attributes.normal as THREE.BufferAttribute;
  const index = indexed.getIndex()!;

  for (let v = 0; v < gNormal.count; v++) {
    // A vertex that a plane cut is, by definition, lying ON that plane — so
    // the plane's own normal IS its surface normal, exactly. Reading it
    // straight off the plane beats deriving a face normal by cross product:
    // it is exact, it costs nothing, and crucially it does not degenerate.
    // The cross-product version produced a white starburst wherever the UV
    // sphere's poles landed, because the sliver triangles that converge
    // there have near-zero area and so yield a garbage direction — and the
    // poles sit on the table and the culet, the two places the eye goes.
    // Every vertex on one facet now gets one identical normal, which is
    // also what makes the facet read as genuinely flat.
    const plane = carvedBy[index.getX(v)];
    if (plane < 0) continue; // untouched rough keeps its smooth normal
    const n = ORDERED_PLANES[plane].normal;
    gNormal.setXYZ(v, n.x, n.y, n.z);
  }
  gNormal.needsUpdate = true;

  indexed.dispose();
  geometry.computeBoundingSphere();
  return geometry;
}

export const CUT_STAGES: THREE.BufferGeometry[] = Array.from(
  { length: STAGE_COUNT },
  (_, i) => buildStage(i / (STAGE_COUNT - 1)),
);
export const CUT_STAGE_COUNT = CUT_STAGES.length;

/** The finished gem — the last stage, i.e. the fully carved stone. */
export const FINISHED_GEM_GEOMETRY = CUT_STAGES[CUT_STAGE_COUNT - 1];

/**
 * A stable "facet edge" point on the finished gem — its topmost vertex, i.e.
 * the table — used by HeroStone.tsx as the world-space anchor for Beat 5's
 * hairline gold rule (components/dom/beats/Beat5Object.tsx). Computed from
 * the actual generated geometry rather than assumed.
 */
export const FACET_ANCHOR_LOCAL = (() => {
  const pos = FINISHED_GEM_GEOMETRY.attributes.position as THREE.BufferAttribute;
  const best = new THREE.Vector3(0, -Infinity, 0);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y > best.y) best.copy(v);
  }
  return best;
})();
