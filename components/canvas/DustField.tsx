"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";

const INHALE = BEATS.find((b) => b.id === "inhale")!;
const CUT = BEATS.find((b) => b.id === "cut")!;

// Just outside the hero stone's unit radius — "the instant the last mote
// passes the hull" (see HeroStone.tsx's roughness snap) is this radius, not
// the exact centre, so motes read as absorbed at the surface rather than
// flying through it.
const HULL_RADIUS = 0.06;
const IDLE_OPACITY = 0.28;

// Deterministic pseudo-random in [0, 1) — Math.random() during render trips
// React's purity rule (calling it inside useMemo is still an impure call in
// the render call graph), and particle layout only needs to look random, not
// actually vary between renders/reloads.
function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Beat 2->3's "Inhale": ambient dust/haze around the hero stone that
 * accelerates inward and is absorbed at the hull, timed to the Inhale beat
 * (lib/beats.ts). Ambient before it (idle drift, present from first paint),
 * fully gone after Cut begins — the dust has been inhaled, it doesn't linger.
 *
 * LOW/STATIC get fewer, larger particles rather than a scaled-down copy of
 * the HIGH staging — this is the brief's "LOW TIER IS ITS OWN DESIGN" rule
 * applied to this beat specifically; the Inhale must still read, just via a
 * cheaper look, not be thinned into invisibility.
 */
export function DustField() {
  const quality = useScroll((s) => s.quality);
  const highTier = quality === "high";
  const count = highTier ? 160 : 42;

  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { positions, dirs, idleRadii, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const dirs: THREE.Vector3[] = [];
    const idleRadii = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        hash(i * 3 + 0.11) * 2 - 1,
        hash(i * 3 + 0.37) * 2 - 1,
        hash(i * 3 + 0.59) * 2 - 1,
      ).normalize();
      dirs.push(dir);
      idleRadii[i] = THREE.MathUtils.lerp(2.6, 5.5, hash(i * 7 + 0.71));
      seeds[i] = hash(i * 5 + 0.23) * Math.PI * 2;
      positions[i * 3] = dir.x * idleRadii[i];
      positions[i * 3 + 1] = dir.y * idleRadii[i];
      positions[i * 3 + 2] = dir.z * idleRadii[i];
    }
    return { positions, dirs, idleRadii, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !materialRef.current) return;
    const { progress } = useScroll.getState();

    const t = THREE.MathUtils.clamp(
      (progress - INHALE.start) / (INHALE.end - INHALE.start),
      0,
      1,
    );
    // Ease-in (t^2), not linear — "accelerates inward" per the brief, not a
    // constant-speed drift.
    const pull = t * t;

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const time = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const r = THREE.MathUtils.lerp(idleRadii[i], HULL_RADIUS, pull);
      const jitter = 0.05 * Math.sin(time * 0.4 + seeds[i]);
      posAttr.setXYZ(
        i,
        dirs[i].x * r + jitter,
        dirs[i].y * r + jitter,
        dirs[i].z * r + jitter,
      );
    }
    posAttr.needsUpdate = true;

    // Fade out right as motes reach the hull so nothing visibly clips into
    // the stone, then stay hidden through Cut onward (dust already inhaled).
    const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 0.82, 1);
    const fadeIn = THREE.MathUtils.smoothstep(progress, 0.02, 0.08);
    const afterCut = progress >= CUT.start ? 0 : 1;
    materialRef.current.opacity = IDLE_OPACITY * fadeIn * fadeOut * afterCut;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#e8dfc8"
        size={highTier ? 0.035 : 0.09}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
