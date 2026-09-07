import * as THREE from "three";

/**
 * The natural specimen — the stone as it comes out of the ground, before any
 * cutting. This is what Beats 1-2 show.
 *
 * Built by sculpting a UV sphere with COHERENT noise, not by jittering
 * vertices. The distinction is the whole reason this reads as a stone rather
 * than as damage: random per-vertex displacement produces high-frequency
 * spikes with no relationship between neighbours — visual static. Smooth
 * multi-octave noise moves whole regions of the surface together, giving
 * broad lobes, gentle hollows and rounded ridges, which is what time-worn
 * mineral actually looks like.
 *
 * A UV sphere base (rather than an icosahedron) is deliberate twice over: it
 * carries proper UVs, which the matrix textures in lib/gemTextures.ts need
 * in order to sit ON the stone, and its topology is regular enough that the
 * sculpt stays controlled.
 *
 * The surface is defined as a purely RADIAL function of direction — every
 * point is `dir * radius(dir)`. That is what lets lib/cutStages.ts carve the
 * finished gem out of this exact shape by simply taking, in each direction,
 * the nearer of "the raw surface" and "the facet planes": the cut sequence
 * begins as this silhouette and removes material from it, so the journey is
 * one continuous stone rather than one object swapped for another.
 */

function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const fade = (t: number) => t * t * (3 - 2 * t);

/** Smooth 3D value noise in [0, 1]. */
function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const tx = fade(x - xi);
  const ty = fade(y - yi);
  const tz = fade(z - zi);

  let result = 0;
  for (let dz = 0; dz <= 1; dz++) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        const weight = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
        result += hash3(xi + dx, yi + dy, zi + dz) * weight;
      }
    }
  }
  return result;
}

/**
 * Overall size of the rough. Larger than the finished gem's girdle radius of
 * 1 on purpose, and by enough margin that the whole brilliant fits inside
 * the rough's TIGHTEST direction — otherwise the cut would have to add
 * material somewhere, which is not a thing cutting can do. The margin is
 * asserted in lib/cutStages.ts rather than assumed here.
 */
export const RAW_SCALE = 1.35;

/** Nodule proportions — a broad stone, wider than it is tall. */
const FLATTEN_Y = 0.8;

/**
 * Radius of the natural stone in a given (normalised) direction.
 *
 * Three octaves, each doing a distinct job:
 *   large   the lobes that give the specimen its overall character
 *   mid     secondary swells breaking those lobes up
 *   fine    a faint surface tooth, kept small so it never becomes noise
 *
 * Clamped well away from zero so the surface can never fold through itself
 * into a spike — the guard that keeps "organic" from becoming "broken".
 */
export function rawRadius(dir: THREE.Vector3): number {
  const big = noise3(dir.x * 1.5 + 4.1, dir.y * 1.5 + 1.7, dir.z * 1.5 + 9.2);
  const mid = noise3(dir.x * 3.4 + 12.5, dir.y * 3.4 + 3.3, dir.z * 3.4 + 5.8);
  const fine = noise3(dir.x * 7.1 + 21.0, dir.y * 7.1 + 8.9, dir.z * 7.1 + 2.4);

  const shape = (big - 0.5) * 0.34 + (mid - 0.5) * 0.1 + (fine - 0.5) * 0.024;
  // Flattening folded into the radius (rather than scaling the point) keeps
  // the surface a pure function of direction — see the note above.
  const flatten = 1 - (1 - FLATTEN_Y) * Math.abs(dir.y);
  return THREE.MathUtils.clamp(1 + shape, 0.74, 1.26) * flatten * RAW_SCALE;
}

/** The smallest radius the rough reaches in any direction. */
export const RAW_MIN_RADIUS = (() => {
  const dir = new THREE.Vector3();
  let min = Infinity;
  const steps = 160;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const theta = (i / steps) * Math.PI;
      const phi = (j / steps) * Math.PI * 2;
      dir.set(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      );
      min = Math.min(min, rawRadius(dir));
    }
  }
  return min;
})();

/**
 * Base sphere shared by the rough and every cut stage — same vertex count,
 * same UVs, same winding, so nothing about the mesh changes across the cut
 * except where its surface sits. Non-indexed so each stage can be given
 * per-facet normals where it has been cut (see lib/cutStages.ts).
 */
export const GEM_BASE_SPHERE = (() => {
  const sphere = new THREE.SphereGeometry(1, 80, 52);
  // Lay the sphere on its side so its poles point along the equator rather
  // than up and down.
  //
  // A UV sphere's poles are where all its longitude lines converge, and the
  // texture converges with them into a starburst pinch. Left on the Y axis,
  // that pinch lands dead centre on the finished gem's TABLE — the largest,
  // flattest, most-looked-at facet on the stone, where it showed as a torn
  // white smear through the matrix. Rotated onto the equator it sits inside
  // the girdle band instead: a thin, near-edge-on strip that is barely a few
  // pixels tall on screen at any point in the journey.
  //
  // The extra 11.25 degrees is half a girdle facet, centring the pinch
  // within one facet rather than letting it straddle the seam between two.
  sphere.rotateZ(Math.PI / 2);
  sphere.rotateY(Math.PI / 16);
  return sphere;
})();

/** Unit directions of the base sphere's vertices, computed once. */
export const GEM_BASE_DIRECTIONS = (() => {
  const pos = GEM_BASE_SPHERE.attributes.position as THREE.BufferAttribute;
  const dirs: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    dirs.push(v.fromBufferAttribute(pos, i).normalize().clone());
  }
  return dirs;
})();

function build(): THREE.BufferGeometry {
  const geometry = GEM_BASE_SPHERE.clone();
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const dir = GEM_BASE_DIRECTIONS[i];
    const r = rawRadius(dir);
    pos.setXYZ(i, dir.x * r, dir.y * r, dir.z * r);
  }
  pos.needsUpdate = true;
  // Smooth (not flat) shading: a natural stone's surface is continuous, so
  // faceting it would contradict the geometry and read as low-poly — the
  // exact failure this replaces. The cut gem IS faceted and gets crisp
  // per-facet normals instead; see lib/cutStages.ts.
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export const RAW_STONE_GEOMETRY = build();

/**
 * A point sitting on the rough's surface, used by
 * components/canvas/LightPoint.tsx so the loader's point of light lands on
 * the stone itself rather than hovering in the air beside it.
 */
export function rawSurfacePoint(dir: THREE.Vector3): THREE.Vector3 {
  const d = dir.clone().normalize();
  return d.multiplyScalar(rawRadius(d));
}
