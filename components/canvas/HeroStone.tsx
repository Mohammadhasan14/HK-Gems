"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { BEATS } from "@/lib/beats";
import { CUT_STAGES, CUT_STAGE_COUNT, FACET_ANCHOR_LOCAL } from "@/lib/cutStages";
import { RAW_STONE_GEOMETRY } from "@/lib/rawStone";
import { GemMaterial } from "./GemMaterial";
import { hud } from "@/lib/hud";
import { facetAnchor } from "@/lib/facetAnchor";

const _anchorWorld = new THREE.Vector3();
const _anchorNdc = new THREE.Vector3();

const ARRIVAL = BEATS.find((b) => b.id === "arrival")!;
const CUT = BEATS.find((b) => b.id === "cut")!;

// Hero composition intro: the stone settles up to its true scale across
// Arrival, then holds at 1. A gentle yaw swings out and fully back to 0 by
// CUT.start (sin(pi) = 0 exactly), so the cut and everything after it render
// with rotation.y pinned at 0 — nothing here leaks a residual transform past
// the Cut boundary.
const INTRO_SCALE_FROM = 0.88;
const YAW_SWING = 0.3;

// A slow continuous turn through the beats that follow the cut, so the
// finished gem's facets travel through the light rather than sitting still.
// Small and constant — the calm of the reference comes from restraint.
const FINISHED_YAW_PER_PROGRESS = 2.2;

// The rough's own radius (lib/rawStone.ts RAW_SCALE) plus a margin — used
// only to detect the camera being inside the stone during the Cut beat,
// where lib/curve.ts waypoint 5 deliberately goes.
const HERO_RADIUS = 1.4;

/**
 * The hero stone, across the whole journey.
 *
 * One continuous specimen in three phases, all sharing lib/gemTextures.ts's
 * turquoise so it stays recognisably the same stone throughout:
 *
 *   before Cut   the natural rough (lib/rawStone.ts)
 *   during Cut   that rough being carved (lib/cutStages.ts)
 *   after Cut    the finished brilliant, i.e. the carve's last stage
 *
 * The cut stages are a genuine progressive carve of the rough by the
 * finished cut's own facet planes, not a crossfade between two models — see
 * lib/cutStages.ts. Every stage shares one topology, so scrubbing the beat
 * moves the surface rather than swapping meshes.
 *
 * Full model spec (proportions, pivot, poly budget, UV requirement, material
 * target) lives in /MODELS.md — that file is the single source of truth for
 * the modeller. Don't duplicate the spec here; if it drifts, MODELS.md wins.
 */
export function HeroStone() {
  const { camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  // "rough" before the cut begins, or a CUT_STAGES index once it has.
  const modeRef = useRef<"rough" | number>("rough");

  useFrame(() => {
    const { progress } = useScroll.getState();

    let mode: "rough" | number = "rough";
    if (progress >= CUT.start) {
      if (progress >= CUT.end) {
        mode = CUT_STAGE_COUNT - 1;
      } else {
        const local = (progress - CUT.start) / (CUT.end - CUT.start);
        mode = Math.min(CUT_STAGE_COUNT - 1, Math.floor(local * CUT_STAGE_COUNT));
      }
    }
    if (mode !== modeRef.current && meshRef.current) {
      meshRef.current.geometry = mode === "rough" ? RAW_STONE_GEOMETRY : CUT_STAGES[mode];
      modeRef.current = mode;
    }

    if (meshRef.current) {
      const introT = THREE.MathUtils.smoothstep(progress, 0, ARRIVAL.end);
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(INTRO_SCALE_FROM, 1, introT));

      if (progress <= CUT.start) {
        const spinPhase = progress / CUT.start;
        meshRef.current.rotation.y = Math.sin(spinPhase * Math.PI) * YAW_SWING;
      } else {
        // Resumes from exactly 0 at CUT.start, so there is no discontinuity
        // at the boundary.
        meshRef.current.rotation.y = (progress - CUT.start) * FINISHED_YAW_PER_PROGRESS;
      }
    }

    // Project the finished gem's facet anchor to screen space every frame,
    // regardless of which stage is showing — Beat 5 (The Object), the only
    // reader, comes after the cut has finished anyway. Same screen-projection
    // technique as LightPoint.tsx.
    if (meshRef.current) {
      _anchorWorld.copy(FACET_ANCHOR_LOCAL).applyMatrix4(meshRef.current.matrixWorld);
      _anchorNdc.copy(_anchorWorld).project(camera);
      facetAnchor.screenX = (_anchorNdc.x * 0.5 + 0.5) * size.width;
      facetAnchor.screenY = (-_anchorNdc.y * 0.5 + 0.5) * size.height;
      facetAnchor.ready = true;
    }

    if (!materialRef.current) return;

    // The polish comes in with the cut itself, not on a separate clock: the
    // stone is unworked until the first facet is ground, and fully polished
    // once the last one is. Driven off the same beat range as the geometry,
    // so surface and shape can never disagree.
    const cutT = THREE.MathUtils.clamp(
      (progress - CUT.start) / (CUT.end - CUT.start),
      0,
      1,
    );
    const polish = THREE.MathUtils.smoothstep(cutT, 0, 1);
    materialRef.current.roughness = THREE.MathUtils.lerp(1, 0.55, polish);
    materialRef.current.clearcoat = THREE.MathUtils.lerp(0.35, 1, polish);
    materialRef.current.clearcoatRoughness = THREE.MathUtils.lerp(0.35, 0.06, polish);
    materialRef.current.bumpScale = THREE.MathUtils.lerp(0.03, 0.012, polish);
    materialRef.current.envMapIntensity = THREE.MathUtils.lerp(0.7, 1.1, polish);
    // Flat shading is wrong for the rough (its surface is genuinely smooth)
    // and right for the cut gem, but the geometry already carries per-facet
    // normals where it has been cut (lib/cutStages.ts), so the material
    // stays smooth-shaded and the mesh decides — which is what lets a
    // half-cut stone show crisp facets against unworked surface.

    // Inside-hull side swap: once the camera (lib/curve.ts waypoint 5) is
    // actually inside the stone's radius, default front-face culling shows
    // nothing, because every visible triangle's normal points away. Flip to
    // back faces so the inside of the stone is what renders instead of a
    // black void.
    const camDist = Math.hypot(
      hud.cameraPosition.x,
      hud.cameraPosition.y,
      hud.cameraPosition.z,
    );
    materialRef.current.side = camDist < HERO_RADIUS ? THREE.BackSide : THREE.FrontSide;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} geometry={RAW_STONE_GEOMETRY} castShadow receiveShadow>
      <GemMaterial ref={materialRef} />
    </mesh>
  );
}
