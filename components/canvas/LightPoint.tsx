"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loaderBridge } from "@/lib/loader";
import { KEY_LIGHT_POSITION } from "@/lib/sceneConstants";
import { GEM_CROWN_HIGHLIGHT_LOCAL } from "@/lib/gemGeometry";

/**
 * Where the highlight sits: on a crown facet of the house cut
 * (lib/gemGeometry.ts), rotated round to the key light's side. This used to
 * be a point on an imagined unit SPHERE around the stone, which — now that
 * the stone is a real brilliant barely 0.32 tall at its table — left the dot
 * hovering in empty air beside it, reading as a stray floating object rather
 * than a highlight. Anchoring it to the actual facet ring is what makes it
 * read as light caught ON the stone.
 */
const HIGHLIGHT_POSITION = (() => {
  const p = GEM_CROWN_HIGHLIGHT_LOCAL.clone();
  const radius = Math.hypot(p.x, p.z);
  // Swing it to the azimuth the key light actually comes from, keeping the
  // facet's own height/radius so it stays on the crown.
  const keyAzimuth = Math.atan2(KEY_LIGHT_POSITION[2], KEY_LIGHT_POSITION[0]);
  p.x = Math.cos(keyAzimuth) * radius;
  p.z = Math.sin(keyAzimuth) * radius;
  // A hair proud of the surface so it is never z-fought by the facet itself.
  p.multiplyScalar(1.015);
  return p;
})();

/** Physical size of the glint sprite, in world units. */
const GLINT_SIZE = 0.26;
/** Held below 1 so the glint enhances the facet rather than burning it out. */
const PEAK_OPACITY = 0.85;

const _ndc = new THREE.Vector3();

/** Soft radial falloff — the sprite's alpha profile. */
function glintTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.12, "rgba(255,250,235,0.85)");
  g.addColorStop(0.4, "rgba(255,240,210,0.18)");
  g.addColorStop(1, "rgba(255,235,200,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * The "point of light" from Beat 1's loader. This mesh exists from the very
 * first frame — it does NOT get created when the loader finishes — so the
 * handoff described in the brief ("digits collapse into a single point of
 * light which BECOMES the specular highlight... continuous object, not a
 * crossfade") is structurally true rather than faked with a timed crossfade:
 * components/dom/Loader.tsx's counter collapses toward this mesh's own
 * screen-projected position (via lib/loader.ts), and this mesh's brightness
 * ramps up over that exact same tween via `loaderBridge.progress`.
 *
 * Once the loader completes, this stays mounted permanently as Beat 1's
 * enhanced specular highlight — it isn't swapped out for "the real thing".
 */
export function LightPoint() {
  const meshRef = useRef<THREE.Sprite>(null);
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  const { camera, size } = useThree();

  const position = useMemo(() => HIGHLIGHT_POSITION.clone(), []);
  const glint = useMemo(() => glintTexture(), []);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;

    // Project this point's world position to CSS pixel coordinates so the
    // DOM loader can collapse its counter toward the exact same pixel.
    _ndc.copy(position).project(camera);
    loaderBridge.screenX = (_ndc.x * 0.5 + 0.5) * size.width;
    loaderBridge.screenY = (-_ndc.y * 0.5 + 0.5) * size.height;
    loaderBridge.ready = true;

    const t = THREE.MathUtils.clamp(loaderBridge.progress, 0, 1);
    // Ease-out pop rather than a linear grow — reads as a flash catching,
    // not a dot inflating.
    const eased = 1 - (1 - t) * (1 - t);
    const scale = THREE.MathUtils.lerp(0.001, GLINT_SIZE, eased);
    meshRef.current.scale.setScalar(scale);
    materialRef.current.opacity = eased * PEAK_OPACITY;
  });

  return (
    // A sprite with a radial falloff, not a solid sphere. As an opaque ball
    // it rendered as a flat disc pasted onto the crown — unmistakably a
    // floating object rather than light. Additive, soft-edged and always
    // camera-facing, it reads as a glint caught on the facet instead.
    <sprite ref={meshRef} position={position} scale={0.001}>
      <spriteMaterial
        ref={materialRef}
        map={glint}
        color="#fff4dd"
        toneMapped={false}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}
