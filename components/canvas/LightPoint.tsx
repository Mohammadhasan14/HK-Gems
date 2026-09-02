"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loaderBridge } from "@/lib/loader";
import { KEY_LIGHT_POSITION } from "@/lib/sceneConstants";

// Direction from the hero stone's centre toward the scene's key spotlight —
// this is where a specular highlight naturally lands on the sphere, so it's
// where the loader's light point belongs too.
const HIGHLIGHT_DIR = new THREE.Vector3(...KEY_LIGHT_POSITION).normalize();
const HERO_RADIUS = 1;

const _ndc = new THREE.Vector3();

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
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera, size } = useThree();

  const position = useMemo(
    () => HIGHLIGHT_DIR.clone().multiplyScalar(HERO_RADIUS * 1.02),
    [],
  );

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
    const scale = THREE.MathUtils.lerp(0.001, 1, eased);
    meshRef.current.scale.setScalar(scale);
    materialRef.current.opacity = eased;
  });

  return (
    <mesh ref={meshRef} position={position} scale={0.001}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#fff4dd"
        toneMapped={false}
        transparent
        opacity={0}
      />
    </mesh>
  );
}
