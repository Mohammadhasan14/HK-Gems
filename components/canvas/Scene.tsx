"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { HeroStone } from "./HeroStone";
import { HeroEnvironment } from "./HeroEnvironment";
import { LightPoint } from "./LightPoint";
import { Strata } from "./Strata";
import { DustField } from "./DustField";
import { BezelAssembly } from "./BezelAssembly";
import { Vitrine } from "./Vitrine";
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
      {/* A three-point product-photography rig, not a general "light the
          scene" setup. Ambient is kept LOW on purpose — flat fill is what
          flattens facets into one grey shape; the contrast between a lit
          facet and its dark neighbour is the entire read of a cut stone. */}
      <ambientLight intensity={0.22} />
      {/* KEY — warm, high, tight. Everything else is measured against it. */}
      <spotLight
        position={KEY_LIGHT_POSITION}
        angle={0.42}
        penumbra={0.75}
        intensity={250}
        color="#fff2dc"
        castShadow
      />
      {/* FILL — cool and soft from the opposite side, low enough that it only
          keeps the shadow side from going fully black. Bounce, not a light. */}
      <directionalLight
        position={[-5, 1.5, 3]}
        intensity={0.5}
        color="#b9c6d8"
      />
      {/* RIM — warm gold kicker behind and opposite the key. Separates the
          stone's silhouette and facet edges from the ground rather than
          relying on ambient, and ties the highlight to the brand's own gold
          instead of a generic cool product-render kicker. */}
      <pointLight position={[-3.0, 1.0, -3.2]} intensity={48} color="#d9b877" />
      {/* BOUNCE — a dim warm uplight standing in for light returning off the
          ground pool, so the pavilion never reads as a solid black wedge. */}
      <pointLight position={[0.4, -2.4, 1.4]} intensity={16} color="#c8a06a" />
      <Environment
        preset="studio"
        environmentIntensity={1.5}
        resolution={highTier ? 256 : 32}
      />
      {/* Beats 1-2 only — fades itself out before Cut, see the component. */}
      <HeroEnvironment />
      <Strata />
      <HeroStone />
      <DustField />
      <BezelAssembly />
      <Vitrine />
      <LightPoint />
      {false && highTier && (
        // Sits at the same height as HeroEnvironment's ground pool so the
        // stone casts into the light it's standing in. At the old -1.5 the
        // two read as two different floors and the shadow became a dark
        // saucer hanging in space below the stone. Wider and softer as well:
        // at scale 1.6 the plane's own edge was visible against the pool.
        <ContactShadows
          position={[0, -1.02, 0.35]}
          opacity={0.55}
          blur={3.2}
          far={1.5}
          scale={4}
        />
      )}
    </>
  );
}
