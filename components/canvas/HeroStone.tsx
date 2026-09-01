"use client";

/**
 * TODO(modeller): Phase 0/1 placeholder. This sphere stands in for
 * HERO_STONE (lib/stones.ts) until the real geometry lands.
 *
 * Model spec for the replacement (also see Beat 3 / lib/beats.ts "cut"):
 *   - Deliver as a sequence of pre-authored "cut stage" BufferGeometries
 *     (NOT runtime CSG — it can't be scrubbed). Phase 2 generates these
 *     procedurally by slicing a convex hull with planes at build time as a
 *     placeholder; final geometry should follow the same stage count so the
 *     scrub choreography doesn't need to change.
 *   - Stage count: 5 (rough hull -> table facet -> crown facets -> pavilion
 *     facets -> final polish), pivot origin at the stone's geometric centre
 *     (0, 0, 0) in local space so it can rotate/orbit in place across Beats
 *     3-5 without a re-parent.
 *   - Poly count target: ~2-4k tris per stage, welded normals, no coplanar
 *     micro-facets (they read as noise under transmission).
 *   - UVs: not load-bearing for the transmissive material itself
 *     (MeshTransmissionMaterial doesn't sample a diffuse map), but a clean
 *     unwrap is still required for the inside-hull refraction shader
 *     (Beat 3) and for any future engraving/logo decal on the girdle.
 *
 * Material target once geometry lands (Phase 1): MeshTransmissionMaterial,
 * transmission 1, thickness 1.5-3, ior from HERO_STONE.ior, roughness 0.02,
 * chromaticAberration 0.06, anisotropy on. For now: a plain lit sphere, per
 * the Phase 0 brief.
 */
export function HeroStone() {
  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#f2f0ea" roughness={0.35} metalness={0} />
    </mesh>
  );
}
