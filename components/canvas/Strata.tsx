"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { hud } from "@/lib/hud";

const ARRIVAL = BEATS.find((b) => b.id === "arrival")!;
const ORIGIN = BEATS.find((b) => b.id === "origin")!;
const INHALE = BEATS.find((b) => b.id === "inhale")!;

// Y-heights the bands sit at, spanning (and a little past) the camera's own
// descent across Origin — lib/curve.ts's waypoint 1 -> 2 goes from y=0.4 to
// y=-0.6. Warm, desaturated rock tones; no two adjacent bands share a value
// so the read is "layers", not one flat tint.
const BAND_YS = [1.3, 0.75, 0.2, -0.35, -0.9, -1.5];
const BAND_COLORS = ["#3a2f26", "#4a3a29", "#5c4832", "#40352c", "#2e2722", "#463a2c"];

/**
 * Beat 2's "strata descent" — concentric horizon rings at fixed world
 * heights that the camera (lib/curve.ts) physically descends past during
 * Origin. Rather than tying each ring's brightness to scroll progress
 * directly, it's tied to the camera's *actual* live Y (via lib/hud.ts,
 * already written every frame by CameraRig) — the ring nearest the camera
 * glows, the rest stay dim, so it reads as passing through layers rather
 * than a scripted fade unrelated to what the camera is doing.
 *
 * `meshBasicMaterial` (unlit) on purpose: these are a background/horizon
 * cue, not lit geometry competing with the hero stone for the scene's one
 * key light.
 */
export function Strata() {
  const materialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const bandYs = useMemo(() => BAND_YS, []);

  useFrame(() => {
    const { progress } = useScroll.getState();
    // Field-wide fade: in across Arrival -> Origin, back out across
    // Origin -> Inhale, so strata only ever reads during the descent itself.
    const fadeIn = THREE.MathUtils.smoothstep(
      progress,
      ARRIVAL.end - 0.03,
      ORIGIN.start + 0.05,
    );
    const fadeOut =
      1 - THREE.MathUtils.smoothstep(progress, ORIGIN.end - 0.05, INHALE.start + 0.02);
    const fieldOpacity = Math.min(fadeIn, fadeOut);

    const camY = hud.cameraPosition.y;
    for (let i = 0; i < bandYs.length; i++) {
      const mat = materialRefs.current[i];
      if (!mat) continue;
      const proximity = THREE.MathUtils.clamp(1 - Math.abs(camY - bandYs[i]) / 0.85, 0, 1);
      mat.opacity = fieldOpacity * THREE.MathUtils.lerp(0.025, 0.2, proximity);
    }
  });

  return (
    <group>
      {bandYs.map((y, i) => (
        <mesh key={y} position={[0, y, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3, 7.2, 64]} />
          <meshBasicMaterial
            ref={(m) => {
              materialRefs.current[i] = m;
            }}
            color={BAND_COLORS[i % BAND_COLORS.length]}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
