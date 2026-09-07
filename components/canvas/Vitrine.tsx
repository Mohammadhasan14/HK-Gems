"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { COLLECTION_ORDER, STONES } from "@/lib/stones";
import { vitrine } from "@/lib/vitrine";
import { FINISHED_GEM_GEOMETRY } from "@/lib/cutStages";
import { getGemTextures } from "@/lib/gemTextures";

const WORN = BEATS.find((b) => b.id === "worn")!;
const COLLECTION = BEATS.find((b) => b.id === "collection")!;

const RADIUS = 3.2;
const TOTAL_TURNS = 1.4;

/** Each piece shows the house cut, at the scale a set stone would be. */
const STONE_SCALE = 0.42;

/**
 * Beat 7's vitrine turntable — the collection, on a ring that rotates as the
 * Collection beat scrolls by. The stone nearest the "front" angle each frame
 * is written to lib/vitrine.ts so Beat7Collection.tsx can highlight the
 * matching placard.
 *
 * Every piece is the SAME house cut the journey just followed
 * (lib/cutStages.ts's finished gem), tinted to its own stone and set in the
 * same silver bezel. Previously these were tinted icosahedra in six
 * saturated colours, which read as a scatter of coloured polygons orbiting
 * the frame — decoration with no relationship to the product. Showing one
 * cut and one setting across the range is what makes it read as a
 * collection: recognisably the same workshop, in six materials.
 */
export function Vitrine() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const bezelRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const { colorMap } = getGemTextures();

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
    bezelRefs.current.forEach((mat) => {
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
        <group
          key={stone.id}
          position={[Math.sin(i * angleStep) * RADIUS, 0, Math.cos(i * angleStep) * RADIUS]}
        >
          <mesh geometry={FINISHED_GEM_GEOMETRY} scale={STONE_SCALE} castShadow>
            <meshStandardMaterial
              ref={(m) => {
                materialRefs.current[i] = m;
              }}
              // The hero's own matrix texture, tinted per stone: the veining
              // belongs to Firoza specifically, but at this size it reads as
              // the depth and variation any cut stone has, and it keeps the
              // six pieces looking like one maker's work.
              map={colorMap}
              color={stone.color}
              roughness={0.25}
              metalness={0.05}
              transparent
              opacity={0}
            />
          </mesh>
          {/* The bezel each stone is set into — the same silver as Beat 4's
              assembly, so the collection reads as finished jewellery rather
              than as loose stones floating on a ring. */}
          <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[STONE_SCALE * 0.82, STONE_SCALE * 0.07, 10, 40]} />
            <meshStandardMaterial
              ref={(m) => {
                bezelRefs.current[i] = m;
              }}
              color="#c8ccd2"
              roughness={0.28}
              metalness={0.9}
              transparent
              opacity={0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
