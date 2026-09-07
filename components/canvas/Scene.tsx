"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, ContactShadows } from "@react-three/drei";
import { BEATS } from "@/lib/beats";
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
const CUT = BEATS.find((b) => b.id === "cut")!;

/**
 * ContactShadows, but only from the Cut beat onward.
 *
 * It is a shadow CATCHER: a plane that darkens whatever is behind it. For
 * every beat from Cut on, "behind it" is the near-black clear colour, so the
 * darkening is invisible and only the stone's shadow reads — which is how it
 * was authored and how it still behaves there. During Beats 1-2 there is now
 * a lit backdrop behind it (HeroEnvironment), and the plane darkens that
 * into a distinctly visible dark disc under the stone — the exact "floating
 * geometric object" artefact this iteration is removing. Hiding it for those
 * two beats is the fix; the backdrop's own falloff carries the floor there,
 * as it does in the reference, where the stone floats above a lit ground
 * rather than sitting on a hard shadow.
 *
 * Gated by a ref in useFrame, not by React state — Scene must not re-render
 * on scroll.
 */
function CutOnwardContactShadows() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = useScroll.getState().progress >= CUT.start;
  });
  return (
    <group ref={ref} visible={false}>
      {/* Values exactly as originally authored, so Beats 3-7 shade
          identically to before this iteration. */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.25}
        blur={2.4}
        far={1.1}
        scale={1.6}
      />
    </group>
  );
}

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
      {/* Ambient carries real weight now that the stone is OPAQUE turquoise
          rather than clear: its colour has to survive into the shadow side,
          or the blue-green only exists where the key happens to land and the
          rest of the stone reads as a grey rock. Still low enough that facet
          contrast — the whole read of a cut stone — is preserved. */}
      <ambientLight intensity={0.34} />
      {/* KEY — warm, high, tight. Everything else is measured against it. */}
      <spotLight
        position={KEY_LIGHT_POSITION}
        angle={0.5}
        penumbra={0.8}
        intensity={230}
        color="#fff2dc"
        castShadow
      />
      {/* FILL — cool and soft from the opposite side, keeping the shadow side
          from going dead while staying clearly subordinate to the key. */}
      <directionalLight position={[-5, 1.5, 3]} intensity={0.9} color="#b9c6d8" />
      {/* RIM — warm gold kicker behind and opposite the key. Separates the
          stone's silhouette from the ground, and ties the highlight to the
          brand's own gold rather than a generic cool product-render kicker.
          It also lights the host-rock matrix, which is the warmest thing on
          the stone and the detail the whole material identity rests on. */}
      <pointLight position={[-3.0, 1.0, -3.2]} intensity={55} color="#d9b877" />
      {/* BOUNCE — dim warm uplight standing in for light returning off the
          floor, so the underside never reads as a solid black wedge. Far
          weaker than it was for the old transparent stone, which needed to
          be lit through from below to be visible at all. */}
      <pointLight position={[0.3, -2.2, 1.2]} intensity={22} color="#c8a06a" />
      <Environment
        preset="studio"
        environmentIntensity={0.85}
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
      {highTier && <CutOnwardContactShadows />}
    </>
  );
}
