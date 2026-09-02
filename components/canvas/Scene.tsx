"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { HeroStone } from "./HeroStone";
import { LightPoint } from "./LightPoint";
import { KEY_LIGHT_POSITION } from "@/lib/sceneConstants";
import { useScroll } from "@/store/useScroll";

/**
 * Phase 1: real materials on the hero stone (see HeroStone.tsx) need
 * something worth reflecting/refracting — a low-intensity HDRI plus the key
 * spotlight, per the brief's MATERIALS section.
 *
 * Verified live on all three tiers (not just compiled): with NO envMap at
 * all, meshPhysicalMaterial's transmission has nothing to refract against
 * the near-black background and the stone renders as a flat black
 * silhouette — exactly the brief's failure mode 5, "nothing read as a
 * gemstone." So every tier gets an Environment; only its cost is tiered.
 * drei's <Environment> bakes its cubemap once at mount (not per frame)
 * unless a `frames` prop is passed, so a small `resolution` keeps the
 * one-time cost cheap on LOW/STATIC rather than needing to omit it.
 * ContactShadows (a genuine render-to-texture pass) stays HIGH-only.
 */
export function Scene() {
  const quality = useScroll((s) => s.quality);
  const highTier = quality === "high";

  return (
    <>
      <CameraRig />
      {/* R3F uses physically-correct (candela) light units, not the old
          "intensity 1 = fully lit" scale — these values look plausible in
          the editor but read as near-black once tone mapping compresses
          them at these distances. */}
      <ambientLight intensity={0.6} />
      <spotLight
        position={KEY_LIGHT_POSITION}
        angle={0.35}
        penumbra={0.6}
        intensity={300}
        castShadow
      />
      <Environment
        preset="studio"
        environmentIntensity={0.7}
        resolution={highTier ? 256 : 32}
      />
      <HeroStone />
      <LightPoint />
      {highTier && (
        <ContactShadows
          position={[0, -1.05, 0]}
          opacity={0.45}
          blur={2.4}
          far={3}
          scale={6}
        />
      )}
    </>
  );
}
