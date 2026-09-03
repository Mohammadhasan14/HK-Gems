"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { useScroll } from "@/store/useScroll";
import { HERO_STONE } from "@/lib/stones";
import { BEATS } from "@/lib/beats";
import { CUT_STAGES, CUT_STAGE_COUNT, FACET_ANCHOR_LOCAL } from "@/lib/cutStages";
import { hud } from "@/lib/hud";
import { facetAnchor } from "@/lib/facetAnchor";

const _anchorWorld = new THREE.Vector3();
const _anchorNdc = new THREE.Vector3();

const IOR = HERO_STONE.ior ?? 1.5;
const ARRIVAL = BEATS.find((b) => b.id === "arrival")!;
const INHALE = BEATS.find((b) => b.id === "inhale")!;
const CUT = BEATS.find((b) => b.id === "cut")!;

// Hero composition intro (Beats 1-2 only, per this iteration's brief): the
// stone materializes from a slightly smaller presentation up to its true
// scale across Arrival, then holds at 1 — by Origin's end this is already
// settled, so it never touches Cut onward. A gentle yaw swings out and
// fully back to 0 by CUT.start (sin(pi) = 0 exactly), so beats 3-7 render
// with rotation.y pinned at 0 exactly as before this change — nothing here
// leaks a residual transform past the Cut boundary.
const INTRO_SCALE_FROM = 0.85;
const YAW_SWING = 0.32;

// Rough/unpolished read for Arrival through Origin and most of Inhale — the
// stone hasn't been "cut" yet. Final values match the two material
// branches' original targets.
const ROUGH_UNCUT = 0.9;
const ROUGH_POLISHED_HIGH = 0.02;
const ROUGH_POLISHED_LOW = 0.08;

// Camera curve waypoint 5 (lib/curve.ts) sits at radius ~0.16 from centre —
// well inside the unit hull — so a small margin above the hero stone's own
// radius (1) is enough to catch "inside" without false-triggering from
// ordinary orbiting distances elsewhere on the curve.
const HERO_RADIUS = 1;

/**
 * TODO(modeller): Phase 1/2 placeholder. This procedurally-cut icosahedron
 * (lib/cutStages.ts) stands in for HERO_STONE (lib/stones.ts) until the real
 * modeller-authored cut-stage geometry lands.
 *
 * Full model spec (stage count, pivot, poly budget, UV requirement,
 * material target) lives in /MODELS.md — that file is the single source of
 * truth for the modeller, kept updated as each placeholder lands. Don't
 * duplicate the spec here; if it drifts from this component, MODELS.md wins.
 */
export function HeroStone() {
  const quality = useScroll((s) => s.quality);
  const highTier = quality === "high";
  const { camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  // roughness/side accept the same shape on both material branches below
  // (drei's MeshTransmissionMaterial and native meshPhysicalMaterial) —
  // typed loosely here since the ref's concrete class differs per branch.
  const materialRef = useRef<{ roughness: number; side: THREE.Side } | null>(null);
  const stageRef = useRef(0);

  useFrame(() => {
    const { progress } = useScroll.getState();

    // Cut-stage swap: which of the 5 precomputed geometries is showing,
    // discretized by scroll position within the Cut beat only. MODELS.md's
    // "not runtime CSG" delivery format — this is a reference swap between
    // geometries that already exist, not a live boolean op.
    let stage = 0;
    if (progress >= CUT.end) stage = CUT_STAGE_COUNT - 1;
    else if (progress > CUT.start) {
      const local = (progress - CUT.start) / (CUT.end - CUT.start);
      stage = Math.min(CUT_STAGE_COUNT - 1, Math.floor(local * CUT_STAGE_COUNT));
    }
    if (stage !== stageRef.current && meshRef.current) {
      meshRef.current.geometry = CUT_STAGES[stage];
      stageRef.current = stage;
    }

    if (meshRef.current) {
      const introT = THREE.MathUtils.smoothstep(progress, 0, ARRIVAL.end);
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(INTRO_SCALE_FROM, 1, introT),
      );
      const spinPhase = Math.min(progress, CUT.start) / CUT.start;
      meshRef.current.rotation.y = Math.sin(spinPhase * Math.PI) * YAW_SWING;
    }

    // Project the final-stage facet anchor to screen space every frame,
    // regardless of which stage is currently showing — Beat 5 (Object),
    // the only reader, comes after Cut has finished at the final stage
    // anyway. Same screen-projection technique as LightPoint.tsx.
    if (meshRef.current) {
      _anchorWorld.copy(FACET_ANCHOR_LOCAL).applyMatrix4(meshRef.current.matrixWorld);
      _anchorNdc.copy(_anchorWorld).project(camera);
      facetAnchor.screenX = (_anchorNdc.x * 0.5 + 0.5) * size.width;
      facetAnchor.screenY = (-_anchorNdc.y * 0.5 + 0.5) * size.height;
      facetAnchor.ready = true;
    }

    if (!materialRef.current) return;

    // A SNAP, not a lerp — "roughness snaps 0.9 -> 0.02 the instant the last
    // mote passes the hull" (see components/canvas/DustField.tsx, which
    // reaches the hull at exactly INHALE.end too, so the two are locked to
    // the same beat boundary rather than independently tuned).
    const polished = progress >= INHALE.end;
    materialRef.current.roughness = polished
      ? highTier
        ? ROUGH_POLISHED_HIGH
        : ROUGH_POLISHED_LOW
      : ROUGH_UNCUT;

    // Inside-hull material swap (CanvasRoot.tsx's "planned Phase 2" note):
    // once the camera (lib/curve.ts waypoint 5) is actually inside the
    // stone's bounding radius, default front-face culling shows literally
    // nothing — every visible triangle now has its normal pointing away
    // from the camera. Flip to back faces so the inside of the facets is
    // what's rendered instead of a black void.
    const camDist = Math.hypot(
      hud.cameraPosition.x,
      hud.cameraPosition.y,
      hud.cameraPosition.z,
    );
    materialRef.current.side = camDist < HERO_RADIUS ? THREE.BackSide : THREE.FrontSide;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      geometry={CUT_STAGES[0]}
      castShadow
      receiveShadow
    >
      {highTier ? (
        // HIGH: drei's MeshTransmissionMaterial — a real backbuffer re-render
        // each frame, so refraction/chromatic aberration/distortion are
        // physically sampled rather than approximated. Expensive; gated to
        // HIGH tier only.
        <MeshTransmissionMaterial
          ref={materialRef}
          flatShading
          transmission={1}
          thickness={2.2}
          ior={IOR}
          roughness={ROUGH_UNCUT}
          chromaticAberration={0.04}
          anisotropy={0.1}
          samples={16}
          resolution={1024}
          color={HERO_STONE.color}
          attenuationColor="#fff3da"
          attenuationDistance={1.1}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.35}
        />
      ) : (
        // LOW/STATIC: native MeshPhysicalMaterial.transmission is a
        // single-pass approximation built into three.js core — no extra
        // render target, no chromatic aberration/distortion, but still real
        // refraction. This is its own staging, not "HIGH minus features":
        // it still reads as a cut, transparent stone at 30fps on mid-range
        // Android, which is the actual LOW-tier bar per the brief.
        <meshPhysicalMaterial
          ref={materialRef}
          flatShading
          transmission={1}
          thickness={1.5}
          ior={IOR}
          roughness={ROUGH_UNCUT}
          color={HERO_STONE.color}
          clearcoat={1}
          clearcoatRoughness={0.2}
          envMapIntensity={1.2}
        />
      )}
    </mesh>
  );
}
