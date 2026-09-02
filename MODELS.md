# Model specs

The single list for the modeller. One entry per placeholder asset, added the
moment the placeholder lands in code — not written up separately after the
fact. Nothing else in the repo should duplicate a spec that belongs here;
code comments should point back to this file instead.

## Status

| Asset | Beat(s) | Placeholder | Spec below |
| --- | --- | --- | --- |
| Hero stone — Durr-e-Najaf | 3, 5 | 5-stage procedural cut sequence, real transmission material | [yes](#hero-stone--durr-e-najaf) |

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

*(Ring / silver parts, and the other five stones — Firoza, Aqeeq, Pukhraj, Zamurd, Yaqoot — get entries here once their placeholders land, starting Phase 3.)*
