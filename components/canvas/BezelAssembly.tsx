"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { toleranceGapFraction } from "@/lib/tolerance";

const CUT = BEATS.find((b) => b.id === "cut")!;
const TOLERANCE = BEATS.find((b) => b.id === "tolerance")!;
const OBJECT = BEATS.find((b) => b.id === "object")!;

const PRONG_COUNT = 4;
const BASE_RADIUS = 1.15;
const EXPLODE_DISTANCE = 1.1;
const METAL_COLOR = "#d9d0b8";

/**
 * Beat 4's "exploded-diagram closing" — a placeholder silver bezel (a ring
 * + prongs) around the hero stone that separates on entry, then draws
 * together in lockstep with Beat4Tolerance.tsx's 12mm -> 0.4mm readout
 * (both driven by lib/tolerance.ts's shared decay curve). Real ring/silver
 * geometry isn't modelled yet — MODELS.md has no entry for it — so this
 * stands in for the assembly, not the finished piece.
 */
export function BezelAssembly() {
  const prongRefs = useRef<(THREE.Mesh | null)[]>([]);
  const prongMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const prongAngles = useMemo(
    () => Array.from({ length: PRONG_COUNT }, (_, i) => (i / PRONG_COUNT) * Math.PI * 2),
    [],
  );

  useFrame(() => {
    const { progress } = useScroll.getState();
    const gap = toleranceGapFraction(progress);

    // Field-wide fade: in across the tail of Cut, out across the start of
    // Object, so the assembly only ever reads during its own beat.
    const fadeIn = THREE.MathUtils.smoothstep(
      progress,
      CUT.end - 0.02,
      TOLERANCE.start + 0.02,
    );
    const fadeOut =
      1 - THREE.MathUtils.smoothstep(progress, OBJECT.start - 0.02, OBJECT.start + 0.06);
    const opacity = Math.min(fadeIn, fadeOut) * 0.8;

    if (ringMatRef.current) ringMatRef.current.opacity = opacity;
    if (ringRef.current) {
      // The ring itself settles downward to girdle height as the gap closes.
      ringRef.current.position.y = -0.15 - gap * 0.5;
    }

    prongAngles.forEach((angle, i) => {
      const mat = prongMatRefs.current[i];
      if (mat) mat.opacity = opacity;
      const mesh = prongRefs.current[i];
      if (!mesh) return;
      // Cones point up by default (a claw prong), just fanned out radially
      // and drawn inward as the gap closes — no reorientation needed.
      const radius = BASE_RADIUS + gap * EXPLODE_DISTANCE;
      mesh.position.set(Math.cos(angle) * radius, -0.1, Math.sin(angle) * radius);
    });
  });

  return (
    <group>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BASE_RADIUS, 0.03, 12, 48]} />
        <meshBasicMaterial ref={ringMatRef} color={METAL_COLOR} transparent opacity={0} />
      </mesh>
      {prongAngles.map((angle, i) => (
        <mesh
          key={angle}
          ref={(m) => {
            prongRefs.current[i] = m;
          }}
          position={[Math.cos(angle) * BASE_RADIUS, 0, Math.sin(angle) * BASE_RADIUS]}
        >
          <coneGeometry args={[0.05, 0.28, 8]} />
          <meshBasicMaterial
            ref={(m) => {
              prongMatRefs.current[i] = m;
            }}
            color={METAL_COLOR}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}
