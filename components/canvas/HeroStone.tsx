"use client";

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useScroll } from "@/store/useScroll";
import { HERO_STONE } from "@/lib/stones";

const IOR = HERO_STONE.ior ?? 1.5;

/**
 * TODO(modeller): Phase 1 placeholder. This faceted icosahedron stands in
 * for HERO_STONE (lib/stones.ts) until the real cut-stage geometry lands.
 *
 * Full model spec (stage count, pivot, poly budget, UV requirement,
 * material target) lives in /MODELS.md — that file is the single source of
 * truth for the modeller, kept updated as each placeholder lands. Don't
 * duplicate the spec here; if it drifts from this component, MODELS.md wins.
 */
export function HeroStone() {
  const quality = useScroll((s) => s.quality);
  const highTier = quality === "high";

  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      {/* detail 0 = the classic 20-face icosahedron — a properly faceted
          convex hull, per the brief's own acceptable-placeholder bar, not a
          smooth default-material ball. flatShading (on both material
          branches below) is what actually makes the facets read as cut
          rather than tessellated-but-smooth. */}
      <icosahedronGeometry args={[1, 0]} />
      {highTier ? (
        // HIGH: drei's MeshTransmissionMaterial — a real backbuffer re-render
        // each frame, so refraction/chromatic aberration/distortion are
        // physically sampled rather than approximated. Expensive; gated to
        // HIGH tier only.
        <MeshTransmissionMaterial
          flatShading
          transmission={1}
          thickness={2}
          ior={IOR}
          roughness={0.02}
          chromaticAberration={0.06}
          anisotropy={0.2}
          samples={6}
          resolution={512}
          color={HERO_STONE.color}
          envMapIntensity={1}
        />
      ) : (
        // LOW/STATIC: native MeshPhysicalMaterial.transmission is a
        // single-pass approximation built into three.js core — no extra
        // render target, no chromatic aberration/distortion, but still real
        // refraction. This is its own staging, not "HIGH minus features":
        // it still reads as a cut, transparent stone at 30fps on mid-range
        // Android, which is the actual LOW-tier bar per the brief.
        <meshPhysicalMaterial
          flatShading
          transmission={1}
          thickness={1.5}
          ior={IOR}
          roughness={0.08}
          color={HERO_STONE.color}
        />
      )}
    </mesh>
  );
}
