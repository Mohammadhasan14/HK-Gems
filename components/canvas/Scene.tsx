"use client";

import { CameraRig } from "./CameraRig";
import { HeroStone } from "./HeroStone";
import { LightPoint } from "./LightPoint";
import { KEY_LIGHT_POSITION } from "@/lib/sceneConstants";

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
      {/* R3F uses physically-correct (candela) light units, not the old
          "intensity 1 = fully lit" scale — these values look plausible in
          the editor but read as near-black once tone mapping compresses
          them at these distances. Bumped so the Phase 0 placeholder is
          actually visible; Phase 1 replaces this with a proper HDRI
          <Environment> + tuned key light once there's a real material to light. */}
      <ambientLight intensity={0.6} />
      <spotLight
        position={KEY_LIGHT_POSITION}
        angle={0.35}
        penumbra={0.6}
        intensity={300}
        castShadow
      />
      <HeroStone />
      <LightPoint />
    </>
  );
}
