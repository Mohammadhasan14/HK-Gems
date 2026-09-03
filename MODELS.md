# Model specs

The single list for the modeller. One entry per placeholder asset, added the
moment the placeholder lands in code — not written up separately after the
fact. Nothing else in the repo should duplicate a spec that belongs here;
code comments should point back to this file instead.

## Status

| Asset | Beat(s) | Placeholder | Spec below |
| --- | --- | --- | --- |
| Hero stone — Durr-e-Najaf | 3, 5 | 5-stage procedural cut sequence, real transmission material | [yes](#hero-stone--durr-e-najaf) |
| Bezel/ring assembly | 4 | procedural ring + 4 prongs, unlit placeholder | [yes](#bezelring-assembly) |
| Firoza, Aqeeq, Pukhraj, Zamurd, Yaqoot (satellite stones) | 7 | tinted icosahedra on the vitrine ring | [yes](#collection-satellite-stones) |

---

## Hero stone — Durr-e-Najaf

- **File**: `components/canvas/HeroStone.tsx`, cut-stage generation in `lib/cutStages.ts`
- **Current placeholder**: 5 `BufferGeometry`s generated at module load by slicing a unit icosahedron with planes (`lib/cutStages.ts`) — swapped by reference in `HeroStone.tsx` based on scroll position within the Cut beat, not regenerated per frame. `flatShading` throughout; `MeshTransmissionMaterial` on HIGH tier, native `meshPhysicalMaterial` transmission on LOW/STATIC (see Material target below — this placeholder already uses the Phase 1 target material)
- **Delivery format**: a sequence of pre-authored "cut stage" `BufferGeometry`s, NOT runtime CSG — CSG can't be scrubbed against scroll position. The real modeller-authored geometry should match this stage count (5) so the existing scroll-driven swap in `HeroStone.tsx` doesn't need to change when it's swapped in — just the `CUT_STAGES` array's source.
- **Stage count**: 5 — rough hull → table facet → crown facets → pavilion facets → final polish.
- **Pivot origin**: geometric centre `(0, 0, 0)` in local space, so it can rotate/orbit in place across Beats 3–5 without a re-parent.
- **Poly count target**: ~2–4k tris per stage, welded normals, no coplanar micro-facets (they read as noise under transmission).
- **UVs**: not load-bearing for the transmissive material itself (`MeshTransmissionMaterial` doesn't sample a diffuse map), but a clean unwrap is still required for the Beat 3 inside-hull refraction shader and any future girdle engraving/logo decal.
- **Material target** (Phase 1): `MeshTransmissionMaterial` — transmission 1, thickness 1.5–3, ior 1.54 (`lib/stones.ts` → `HERO_STONE.ior`), roughness 0.02, chromaticAberration 0.06, anisotropy on.

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
- **Current placeholder**: `icosahedronGeometry(0.32, 0)` per stone, `meshStandardMaterial` tinted to each stone's `color` field in `lib/stones.ts` — same placeholder shape as the hero stone's Phase 0 stand-in, just small and untransmissive (all five are secondary/background elements here, not the showcase piece).
- **Delivery format**: one small showcase-quality model per stone eventually; `optics` in `lib/stones.ts` already records which should end up transmissive (Pukhraj, Zamurd, Yaqoot, plus the hero) vs. opaque (Firoza, Aqeeq) for whoever picks up the real materials pass.
- **Pivot origin**: geometric centre, matching the hero stone's convention — the vitrine ring positions each by its mesh's own `position`, not a parent offset.
