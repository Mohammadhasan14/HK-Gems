"use client";

/**
 * TODO(modeller): Phase 0/1 placeholder. This sphere stands in for
 * HERO_STONE (lib/stones.ts) until the real geometry lands.
 *
 * Full model spec (stage count, pivot, poly budget, UV requirement,
 * material target) lives in /MODELS.md — that file is the single source of
 * truth for the modeller, kept updated as each placeholder lands. Don't
 * duplicate the spec here; if it drifts from this component, MODELS.md wins.
 */
export function HeroStone() {
  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#f2f0ea" roughness={0.35} metalness={0} />
    </mesh>
  );
}
