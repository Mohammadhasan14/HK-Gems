"use client";

import { forwardRef } from "react";
import * as THREE from "three";
import { getGemTextures } from "@/lib/gemTextures";

/**
 * The turquoise material, shared by every mesh that shows the hero stone —
 * the rough, every cut stage, the finished gem — so the same specimen is
 * recognisably itself the whole way through the journey.
 *
 * Opaque, not transmissive. Turquoise is an opaque stone; the previous
 * clear-quartz treatment is what forced the earlier "black glass" problem,
 * because a transparent object on a dark set can only ever be as bright as
 * what is behind it. An opaque body with a real colour map has its own value
 * regardless of the background, which is why this reads as a gemstone under
 * studio light rather than as a dark shape.
 *
 * Roughness and bump both come from maps rather than constants (see
 * lib/gemTextures.ts): the matrix veining is rougher and slightly recessed
 * relative to the polished body, which is what makes it look embedded in the
 * stone instead of drawn on top of it.
 */
export const GemMaterial = forwardRef<
  THREE.MeshPhysicalMaterial,
  {
    /** Cut stones take a harder polish than the unworked rough. */
    polished?: boolean;
    flatShading?: boolean;
    side?: THREE.Side;
  }
>(function GemMaterial({ polished = false, flatShading = false, side }, ref) {
  const { colorMap, roughnessMap, bumpMap } = getGemTextures();

  return (
    <meshPhysicalMaterial
      ref={ref}
      map={colorMap}
      roughnessMap={roughnessMap}
      bumpMap={bumpMap}
      // Small: the maps carry the surface detail, and a heavy bump on a
      // stone this size reads as crust rather than polish.
      bumpScale={polished ? 0.012 : 0.03}
      // Scales the roughness map rather than replacing it, so the polished
      // stone keeps the body/matrix contrast while sitting glossier overall.
      roughness={polished ? 0.55 : 1}
      metalness={0}
      // A thin clearcoat is what a polished cabochon or facet actually has:
      // a sharp specular layer sitting over a diffuse coloured body. Without
      // it the stone reads as unglazed ceramic.
      clearcoat={polished ? 1 : 0.35}
      clearcoatRoughness={polished ? 0.06 : 0.35}
      // Turquoise is faintly translucent at its edges, not transparent.
      // Enough to keep thin sections from going dead, no more.
      transmission={0}
      sheen={0.2}
      sheenColor="#9fdcd8"
      sheenRoughness={0.6}
      envMapIntensity={polished ? 1.1 : 0.7}
      flatShading={flatShading}
      side={side}
    />
  );
});
