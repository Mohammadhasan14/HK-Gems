"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

/**
 * The one persistent Canvas — fixed, behind all DOM, mounted once here at
 * the layout level (via components/dom/SiteShell.tsx). Never mount/unmount
 * a scene per section; every beat's 3D content lives inside this same
 * <Scene>, driven by scroll progress, not by mount/unmount.
 *
 * `near` is deliberately tiny: Beat 3 puts the camera inside the hero
 * stone's hull on purpose (see lib/curve.ts waypoint 5), and the previous
 * attempt at this site clipped the mesh through the near plane at the end
 * of the page (failure mode #4 in the brief). A small near plane plus the
 * dedicated inside-hull material swap planned for Phase 2 is how that's
 * avoided instead of just hoping the camera never gets close.
 */
export function CanvasRoot() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        camera={{ fov: 35, near: 0.01, far: 100, position: [0, 1.2, 9] }}
      >
        <color attach="background" args={["#08080A"]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
