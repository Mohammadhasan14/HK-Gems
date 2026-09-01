"use client";

import { CameraRig } from "./CameraRig";
import { HeroStone } from "./HeroStone";

/**
 * Phase 0: camera rig + one lit placeholder stone. Environment lighting,
 * ContactShadows, and postprocessing (Bloom/Vignette/ChromaticAberration/
 * Noise) land in Phase 1 alongside the real materials — adding them now,
 * before there's a material worth lighting, would just be noise to review.
 */
export function Scene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.15} />
      <spotLight
        position={[4, 6, 5]}
        angle={0.35}
        penumbra={0.6}
        intensity={60}
        castShadow
      />
      <HeroStone />
    </>
  );
}
