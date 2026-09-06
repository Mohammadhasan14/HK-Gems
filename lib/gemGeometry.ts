import * as THREE from "three";

/**
 * The HK Gems house cut — a purpose-built brilliant, authored facet group by
 * facet group, for every beat before The Cut. Replaces the generic
 * icosahedron read those beats had: a primitive has no lapidary structure,
 * so no amount of material work could make it read as "cut gemstone" rather
 * than "low-poly rock."
 *
 * Deliberately NOT part of lib/cutStages.ts's CUT_STAGES sequence — that
 * file (and everything Beat 3 onward derives from it, including Beat 5's
 * FACET_ANCHOR_LOCAL) is untouched by this one. HeroStone.tsx shows this
 * geometry only while progress is before the Cut beat, and swaps to
 * CUT_STAGES[0] the instant Cut begins, so Beat 3 onward renders exactly as
 * before this file existed.
 *
 * ── The cut ────────────────────────────────────────────────────────────
 * Eight-fold symmetry, 57 facets, laid out as a real round brilliant:
 *
 *   table          1   flat octagon, the eye's resting point
 *   star facets    8   triangles falling from the table's edges
 *   bezel kites    8   the crown's main facets, table corner -> girdle
 *   upper halves  16   the crown's break facets, star point -> girdle
 *   girdle band   16   the thin vertical wall at the widest point
 *   lower halves  16   the pavilion's break facets
 *   pavilion mains 8   long kites converging on the culet
 *
 * The proportions below are the ratios a real ideal-cut round brilliant is
 * graded against (as % of girdle diameter): table 56, crown height 14.6,
 * pavilion depth 43, girdle 3, total depth ~61. Everything else — where the
 * star points and lower-half junctions sit, and therefore every facet angle
 * — is DERIVED from those, not eyeballed: each break facet's junction point
 * is solved onto the plane of the main facet it borders, which is exactly
 * what makes the resulting crown/pavilion angles land at ~34 deg / ~41 deg,
 * the angles a lapidary actually cuts for. Facets meet in clean lines and
 * every group is a coherent optical family rather than a spray of
 * triangles, which is what lets light read as structure across the stone.
 */

/** Azimuthal symmetry — 8 mains, 16 break facets, 16 girdle segments. */
const N = 8;
const HALF_STEP = Math.PI / N; // half of one 45-deg sector, i.e. 22.5 deg

// Girdle radius is the unit; every other number is a ratio against the
// girdle DIAMETER (2), the way a lapidary spec sheet is written.
const R_GIRDLE = 1;
const R_TABLE = 0.56; // table 56% of diameter
const CROWN_HEIGHT = 0.292; // 14.6% of diameter
const PAVILION_DEPTH = 0.86; // 43% of diameter
const GIRDLE_HALF_THICKNESS = 0.03; // 3% of diameter, split above/below

const Y_GIRDLE_TOP = GIRDLE_HALF_THICKNESS;
const Y_GIRDLE_BOTTOM = -GIRDLE_HALF_THICKNESS;
const Y_TABLE = Y_GIRDLE_TOP + CROWN_HEIGHT;
const Y_CULET = Y_GIRDLE_BOTTOM - PAVILION_DEPTH;

// How far out the crown's star points sit (star facet length) and how far
// in the pavilion's lower-half junctions sit (lower half length). Both are
// radii; their HEIGHTS are solved below rather than chosen, so the break
// facets share an exact edge with the main facets they border.
const R_STAR = 0.82;
const R_LOWER = 0.25;

/**
 * A main facet's plane is the plane through its girdle edge and its apex,
 * tilted purely radially. Solving a break-facet junction onto that plane is
 * a single linear equation, so both junction heights below are exact — no
 * fitting, no fudge factor, and the two facet families never crack apart
 * along their shared edge.
 *
 * Each constant is the tangent of that plane's normal tilt off vertical —
 * radial run over vertical rise. The bezel plane contains the table corner
 * (R_TABLE, Y_TABLE) and the girdle (R_GIRDLE, Y_GIRDLE_TOP); the pavilion
 * main plane contains the girdle and the culet point.
 */
const CROWN_TAN = (R_GIRDLE - R_TABLE) / (Y_TABLE - Y_GIRDLE_TOP);
const PAVILION_TAN = R_GIRDLE / (Y_GIRDLE_BOTTOM - Y_CULET);

// Junction points sit half a sector round from the mains, so their radius
// projects onto the main's radial axis by cos(22.5 deg).
const PROJECTION = Math.cos(HALF_STEP);

/** Star point: on the bezel plane, at radius R_STAR. */
const Y_STAR = Y_GIRDLE_TOP + (R_GIRDLE - R_STAR * PROJECTION) / CROWN_TAN;
/** Lower-half junction: on the pavilion main plane, at radius R_LOWER. */
const Y_LOWER = Y_GIRDLE_BOTTOM - (R_GIRDLE - R_LOWER * PROJECTION) / PAVILION_TAN;

/**
 * A ring of N points at `radius`/`height`. `offset` in sector-halves: 0 puts
 * points on the main axes, 1 puts them between the mains (where every break
 * facet junction and every other girdle vertex lives).
 */
function ring(radius: number, height: number, offset = 0): THREE.Vector3[] {
  return Array.from({ length: N }, (_, i) => {
    const a = i * 2 * HALF_STEP + offset * HALF_STEP;
    return new THREE.Vector3(Math.cos(a) * radius, height, Math.sin(a) * radius);
  });
}

function build(): THREE.BufferGeometry {
  const tris: THREE.Vector3[] = [];

  /**
   * Winding convention, shared by every facet below: walk the facet's
   * outline with azimuth INCREASING along its upper edge and DECREASING
   * along its lower edge. That yields an outward-facing normal for every
   * group — up-and-out across the crown, radial at the girdle, down-and-out
   * across the pavilion — which is the whole reason a cut stone reads as
   * distinct facets catching separate light rather than one smooth shell.
   */
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    tris.push(a.clone(), b.clone(), c.clone());
  };
  const quad = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    d: THREE.Vector3,
  ) => {
    tri(a, b, c);
    tri(a, c, d);
  };

  const table = ring(R_TABLE, Y_TABLE);
  const star = ring(R_STAR, Y_STAR, 1);
  const girdleTopMain = ring(R_GIRDLE, Y_GIRDLE_TOP);
  const girdleTopHalf = ring(R_GIRDLE, Y_GIRDLE_TOP, 1);
  const girdleBottomMain = ring(R_GIRDLE, Y_GIRDLE_BOTTOM);
  const girdleBottomHalf = ring(R_GIRDLE, Y_GIRDLE_BOTTOM, 1);
  const lower = ring(R_LOWER, Y_LOWER, 1);
  const tableCenter = new THREE.Vector3(0, Y_TABLE, 0);
  const culet = new THREE.Vector3(0, Y_CULET, 0);

  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const p = (i + N - 1) % N; // previous sector

    // TABLE — fanned from the centre, but every triangle shares the same
    // normal, so it shades as the single flat octagon it is.
    tri(tableCenter, table[j], table[i]);

    // STAR FACETS — shallow triangles hanging off each table edge down to
    // the star point between the two bezels. The gentlest angle on the
    // stone (~23 deg), so they stay bright while the bezels go dark.
    tri(table[i], table[j], star[i]);

    // BEZEL KITES — the crown mains. Table corner at the top, girdle at the
    // bottom, a star point at each side.
    quad(table[i], star[i], girdleTopMain[i], star[p]);

    // UPPER GIRDLE HALVES — the crown's break facets, filling each star
    // point down to the girdle in two triangles.
    tri(star[i], girdleTopHalf[i], girdleTopMain[i]);
    tri(star[i], girdleTopMain[j], girdleTopHalf[i]);

    // GIRDLE — the vertical band at the widest point, 16 segments so the
    // silhouette reads round rather than octagonal.
    quad(girdleTopMain[i], girdleTopHalf[i], girdleBottomHalf[i], girdleBottomMain[i]);
    quad(girdleTopHalf[i], girdleTopMain[j], girdleBottomMain[j], girdleBottomHalf[i]);

    // LOWER GIRDLE HALVES — the pavilion's break facets, mirroring the
    // upper halves down to the lower junction point.
    tri(girdleBottomMain[i], girdleBottomHalf[i], lower[i]);
    tri(girdleBottomHalf[i], girdleBottomMain[j], lower[i]);

    // PAVILION MAINS — long kites from the girdle to the culet. These are
    // what actually return light through the table, and what gives the
    // silhouette its controlled point.
    quad(girdleBottomMain[i], lower[i], culet, lower[p]);
  }

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(tris.length * 3);
  tris.forEach((v, i) => v.toArray(positions, i * 3));
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  // Non-indexed, so this is a per-face normal — paired with `flatShading` on
  // the material, each facet stays a crisp, separately-lit plane.
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export const GEM_DISPLAY_GEOMETRY = build();

/**
 * A point sitting on the crown, in local space — used by
 * components/canvas/LightPoint.tsx so the loader's point of light lands on
 * an actual facet instead of hovering in the air beside the stone.
 */
export const GEM_CROWN_HIGHLIGHT_LOCAL = new THREE.Vector3(
  Math.cos(HALF_STEP) * R_STAR,
  Y_STAR,
  Math.sin(HALF_STEP) * R_STAR,
);
