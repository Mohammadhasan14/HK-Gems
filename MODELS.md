# Model specs

The single list for the modeller. One entry per placeholder asset, added the
moment the placeholder lands in code — not written up separately after the
fact. Nothing else in the repo should duplicate a spec that belongs here;
code comments should point back to this file instead.

## Status

| Asset | Beat(s) | Placeholder | Spec below |
| --- | --- | --- | --- |
| Hero stone — Firoza | 1–7 | procedural rough + 9-stage carve + procedural turquoise material | [yes](#hero-stone--firoza) |
| Bezel/ring assembly | 4 | procedural ring + 4 prongs, unlit placeholder | [yes](#bezelring-assembly) |
| Durr-e-Najaf, Aqeeq, Pukhraj, Zamurd, Yaqoot (satellite stones) | 7 | the house cut, tinted per stone, in a procedural bezel | [yes](#collection-satellite-stones) |

---

## Hero stone — Firoza

The hero stone is **Firoza** (Nishapuri turquoise), set by `HERO_STONE_ID` in
`lib/stones.ts`. Opaque, blue-green, webbed with host-rock matrix. It was
Durr-e-Najaf (clear quartz) through Phase 1; the change is deliberate and
load-bearing, not cosmetic. A transparent stone on a near-black set can only
ever be as bright as whatever is behind it, which is why it kept rendering as
black glass no matter how the lights were pushed. An opaque body with a real
colour map has its own value under any light.

- **Files**: `components/canvas/HeroStone.tsx` (phases), `lib/rawStone.ts` (the
  rough), `lib/gemGeometry.ts` (the cut, as planes), `lib/cutStages.ts` (the
  carve), `lib/gemTextures.ts` + `components/canvas/GemMaterial.tsx` (material)
- **Current placeholder — one continuous stone, three phases.** Before Beat 3
  it is the natural rough; across Beat 3 that rough is carved; after Beat 3 it
  is the finished gem, which is simply the carve's last stage. All three share
  one material, so it stays recognisably the same specimen throughout.
- **The rough** (`lib/rawStone.ts`): a UV sphere sculpted by COHERENT
  multi-octave noise — broad lobes and gentle hollows, not per-vertex jitter,
  which is only visual static. Defined as a purely radial function of
  direction, `dir * radius(dir)`; that is what makes the carve below exact.
  Smooth-shaded, because a natural surface is continuous.
- **The cut** (`lib/gemGeometry.ts`): the **HK Gems house cut**, a 57-facet
  round brilliant with 8-fold symmetry — table, 8 star facets, 8 bezel kites,
  16 upper girdle halves, a 16-segment girdle band, 16 lower girdle halves, 8
  pavilion mains to a point. What the module exports is not a mesh but
  `GEM_FACET_PLANES`, the half-spaces those facets bound.
- **The carve** (`lib/cutStages.ts`): 9 stages, each the rough with more of
  those planes ground into it. Because both shapes are radial, the surface in
  any direction is just the nearest limit acting there — the rough's own
  radius, or `d / (n · u)` per facet plane — so the finished gem is literally
  the rough with material removed. Every stage reuses one base sphere's
  vertices and UVs, so the topology never changes and the beat scrubs without
  popping. Planes are eased in group by group in the order a cutter works:
  table, crown, girdle, pavilion. A load-bearing invariant is asserted at
  module load: the cut must fit inside the rough's tightest direction, since
  cutting cannot add material. **Shading**: a carved vertex's normal is read
  straight off the plane that cut it (exact, and immune to the degenerate
  slivers at the sphere's poles); untouched rough keeps smooth normals. That
  is what lets a half-cut stone show crisp facets against unworked surface.
- **House cut proportions** (as % of girdle diameter, the way a lapidary spec
  sheet reads): table 56, crown height 14.6, pavilion depth 43, girdle 3,
  total depth ~61. Every facet angle is *derived* from those rather than
  chosen — each break-facet junction is solved onto the plane of the main
  facet it borders — landing the crown at 33.6°, pavilion 40.7°, star facets
  23.4°, girdle halves ~41.5°, all inside real ideal-cut ranges. **A modeller
  replacing this must preserve those angles**: they are what makes the stone
  read as cut rather than faceted-at-random.
- **Scale**: the rough is `RAW_SCALE` 1.35 (max radius ~1.66); the finished cut
  is `CUT_SCALE` 0.78 of the proportions above. The finished gem being clearly
  smaller than its rough is the point, and the camera (`lib/curve.ts`) is
  authored to compensate — waypoints 0–4 sit further out than 6–10 so the
  SUBJECT stays a constant size in frame while the stone shrinks.
- **Material** (`lib/gemTextures.ts`): three coupled maps generated once at
  module load — colour (mottled body + matrix web), roughness (matrix rougher
  than the polished body) and bump (matrix recessed). All three derive from
  the SAME vein field, which is what makes the matrix read as embedded rather
  than painted on. The web is a Voronoi boundary field, which is genuinely how
  turquoise matrix forms — host rock filling the gaps between nodules — so the
  cells come out closed and irregular instead of looking like gold wire. Vein
  width is noise-varied for the same reason. A uniform grid over the seeds
  keeps generation fast; without it this is a resolution × seed-count product
  that locks the main thread for seconds.
- **Polish** is driven off the Cut beat's own range in `HeroStone.tsx`, so
  surface and shape can never disagree: roughness, clearcoat, bump and env
  response all move from unworked to polished exactly as the facets appear.
- **Delivery format**: pre-authored/procedural geometry, NOT runtime CSG — CSG
  can't be scrubbed against scroll position. A modeller-authored asset should
  supply the rough and the finished cut as one continuous carve (or a stage
  sequence with matching topology), not two unrelated models; the phase logic
  in `HeroStone.tsx` and the radial carve in `lib/cutStages.ts` assume
  material only ever comes off.
- **Pivot origin**: geometric centre `(0, 0, 0)`, so it can rotate/orbit in
  place across Beats 3–5 without a re-parent.
- **UVs**: load-bearing now, unlike in Phase 1 — the matrix maps sample them.
  A clean unwrap is required. Note the one known artefact: a UV sphere pinches
  at its poles, and the base sphere is deliberately rotated so those poles sit
  in the girdle band rather than on the table. A real unwrap should avoid the
  pinch outright.

---

## Bezel/ring assembly

- **File**: `components/canvas/BezelAssembly.tsx`
- **Current placeholder**: a `torusGeometry` ring + 4 `coneGeometry` prongs, unlit `meshBasicMaterial`, procedurally positioned — not a modelled asset. Prongs fan out radially and the ring drops to explode; both draw back together as `lib/tolerance.ts`'s gap fraction closes.
- **Delivery format**: real silver-part geometry can replace the whole component's render output directly — the explode/close driver (`toleranceGapFraction`) is already decoupled in `lib/tolerance.ts` and doesn't assume anything about part shape.
- **Pivot origin**: each part's own local origin is already where it needs to be for its radial offset; a real model just needs a sane local origin at its own attachment point.
- **Material target**: not yet specified — this stands in as an unlit metal-tone silhouette only, no lighting response.

---

## Collection satellite stones

- **File**: `components/canvas/Vitrine.tsx`
- **Current placeholder**: each piece is the hero's own finished cut
  (`FINISHED_GEM_GEOMETRY`) at `STONE_SCALE`, tinted to that stone's `color`
  from `lib/stones.ts` and sharing the hero's matrix colour map, set in a
  procedural `torusGeometry` bezel. Previously these were tinted icosahedra in
  six saturated colours, which read as a scatter of coloured polygons orbiting
  the frame — decoration with no relationship to the product. One cut and one
  setting across the range is what makes it read as a collection.
- **Delivery format**: one small showcase-quality model per stone eventually.
  `optics` in `lib/stones.ts` records which should end up transmissive
  (Pukhraj, Zamurd, Yaqoot, Durr-e-Najaf) vs. opaque (Firoza, Aqeeq) for
  whoever picks up the real materials pass — the shared house cut here is a
  stand-in, not a claim that all six are cut identically.
- **Pivot origin**: geometric centre, matching the hero stone's convention —
  the vitrine ring positions each by its own `position`, not a parent offset.
