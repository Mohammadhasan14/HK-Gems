"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";

const CUT = BEATS.find((b) => b.id === "cut")!;
const INHALE = BEATS.find((b) => b.id === "inhale")!;

/**
 * The world the hero stone sits in, for Beats 1-2 (through the Inhale).
 *
 * The problem this solves: with nothing but a flat #08080A clear colour, the
 * stone had no environment to belong to — it read as an object composited
 * onto a void rather than a subject lit inside a space, which is most of the
 * distance between "WebGL demo" and "product film". Three cheap, entirely
 * non-interactive layers supply that space:
 *
 *   backdrop  a large plane far behind everything, carrying a soft warm
 *             pool of light that falls off into black — the "wall" that
 *             gives the frame depth instead of absolute nothing
 *   shaft     a tall soft column of light descending through the stone,
 *             the source the backdrop glow implies
 *   ground    an elliptical pool on the floor beneath the stone, which is
 *             what actually grounds it in the space rather than floating
 *
 * All three are unlit, additive, depth-write-off gradients — no extra
 * lights, no shadow passes, no postprocessing. They cost one draw call each
 * and are safe on the LOW tier.
 *
 * Every layer is faded to fully transparent BEFORE the Cut beat begins, so
 * Beat 3 onward renders precisely as it did before this component existed —
 * this iteration is scoped to Beats 1-2 and that scope is enforced here
 * rather than assumed.
 */

/** Radial falloff sprite, drawn once into a canvas and reused by all layers. */
function radialTexture(
  inner: string,
  outer: string,
  stops: Array<[number, string]> = [],
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, inner);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Vertical falloff, bright at the top — the light shaft's profile. */
function shaftTexture(): THREE.CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const vertical = ctx.createLinearGradient(0, 0, 0, h);
  vertical.addColorStop(0, "rgba(255,236,200,0.55)");
  vertical.addColorStop(0.55, "rgba(255,224,175,0.16)");
  vertical.addColorStop(1, "rgba(255,214,160,0)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, w, h);
  // Soften the vertical edges so the column has no hard sides.
  const horizontal = ctx.createLinearGradient(0, 0, w, 0);
  horizontal.addColorStop(0, "rgba(0,0,0,1)");
  horizontal.addColorStop(0.5, "rgba(0,0,0,0)");
  horizontal.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Tuned against the rendered frame, not guessed: at higher values the
// backdrop stopped reading as depth and became a brown haze washing over
// the header, and the ground pool became a bright blob competing with the
// stone. The environment's job is to be felt, not seen.
const BACKDROP_OPACITY = 0.4;
const SHAFT_OPACITY = 0.28;
const GROUND_OPACITY = 0.3;

export function HeroEnvironment() {
  const quality = useScroll((s) => s.quality);
  const groupRef = useRef<THREE.Group>(null);
  const backdropRef = useRef<THREE.MeshBasicMaterial>(null);
  const shaftRef = useRef<THREE.MeshBasicMaterial>(null);
  const groundRef = useRef<THREE.MeshBasicMaterial>(null);

  const textures = useMemo(
    () => ({
      backdrop: radialTexture("rgba(84,62,38,0.9)", "rgba(8,8,10,0)", [
        [0.22, "rgba(46,34,22,0.42)"],
        [0.45, "rgba(20,16,13,0.1)"],
      ]),
      ground: radialTexture("rgba(255,226,178,0.85)", "rgba(255,214,160,0)", [
        [0.18, "rgba(206,168,110,0.3)"],
        [0.42, "rgba(96,76,50,0.07)"],
      ]),
      shaft: shaftTexture(),
    }),
    [],
  );

  useFrame(() => {
    const { progress } = useScroll.getState();

    // Full strength from the very first frame — the hero shot is the one
    // frame that must land — then out across the Inhale, so the last frame
    // before Cut is already back to the bare scene Beat 3 expects.
    const opacity =
      1 - THREE.MathUtils.smoothstep(progress, INHALE.start, CUT.start);

    if (groupRef.current) groupRef.current.visible = opacity > 0.001;
    if (backdropRef.current) backdropRef.current.opacity = opacity * BACKDROP_OPACITY;
    if (shaftRef.current) shaftRef.current.opacity = opacity * SHAFT_OPACITY;
    if (groundRef.current) groundRef.current.opacity = opacity * GROUND_OPACITY;
  });

  return (
    <group ref={groupRef}>
      {/* Backdrop — well behind the stone and large enough to fill frame at
          every Beat 1-2 camera position. Normal (not additive) blending so
          it reads as a lit wall rather than a glow floating in front. */}
      <mesh position={[0.05, -0.35, -6]}>
        <planeGeometry args={[24, 15]} />
        <meshBasicMaterial
          ref={backdropRef}
          map={textures.backdrop}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Light shaft descending onto the stone. Skipped on the lower tiers:
          it is the most overdraw-heavy layer and the least load-bearing —
          the ground pool alone still grounds the stone. */}
      {quality === "high" && (
        <mesh position={[0.15, 1.9, -1.6]}>
          <planeGeometry args={[3.4, 6.4]} />
          <meshBasicMaterial
            ref={shaftRef}
            map={textures.shaft}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Ground pool — flat on the floor, just under the stone's culet. */}
      <mesh position={[0, -1.0, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 5.4]} />
        <meshBasicMaterial
          ref={groundRef}
          map={textures.ground}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
