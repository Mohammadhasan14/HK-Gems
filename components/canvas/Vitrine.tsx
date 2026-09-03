"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { COLLECTION_ORDER, STONES } from "@/lib/stones";
import { vitrine } from "@/lib/vitrine";

const WORN = BEATS.find((b) => b.id === "worn")!;
const COLLECTION = BEATS.find((b) => b.id === "collection")!;

const RADIUS = 3.2;
const TOTAL_TURNS = 1.4;

/**
 * Beat 7's vitrine turntable — six small placeholder stones (none of the
 * five non-hero stones have real geometry yet, per MODELS.md's closing
 * note) on a ring that rotates as the Collection beat scrolls by. The stone
 * nearest the "front" angle each frame is written to lib/vitrine.ts so
 * Beat7Collection.tsx can highlight the matching placard.
 */
export function Vitrine() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const stones = useMemo(() => COLLECTION_ORDER.map((id) => STONES[id]), []);
  const angleStep = (Math.PI * 2) / stones.length;

  useFrame(() => {
    const { progress } = useScroll.getState();

    const fadeIn = THREE.MathUtils.smoothstep(progress, WORN.end - 0.02, COLLECTION.start + 0.03);
    const local = THREE.MathUtils.clamp(
      (progress - COLLECTION.start) / (COLLECTION.end - COLLECTION.start),
      0,
      1,
    );
    const rotation = local * TOTAL_TURNS * Math.PI * 2;

    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
      groupRef.current.visible = fadeIn > 0.01;
    }
    materialRefs.current.forEach((mat) => {
      if (mat) mat.opacity = fadeIn;
    });

    // Whichever stone's own angle (its fixed position angle plus the
    // group's current rotation) lands closest to 0 ("front") is active.
    let bestIndex = 0;
    let bestDist = Infinity;
    stones.forEach((_, i) => {
      const angle = i * angleStep + rotation;
      const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
      const dist = Math.abs(wrapped);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    });
    vitrine.activeIndex = bestIndex;
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      {stones.map((stone, i) => (
        <mesh
          key={stone.id}
          position={[Math.sin(i * angleStep) * RADIUS, 0, Math.cos(i * angleStep) * RADIUS]}
          castShadow
        >
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            ref={(m) => {
              materialRefs.current[i] = m;
            }}
            color={stone.color}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={0}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
