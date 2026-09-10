"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Scene } from "./Scene";
import { useScroll } from "@/store/useScroll";
import * as THREE from "three";

function ScrollFrames() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const off = useScroll.subscribe(() => invalidate());
    const loaded = () => invalidate();
    window.addEventListener("mineral-texture-ready", loaded);
    return () => { off(); window.removeEventListener("mineral-texture-ready", loaded); };
  }, [invalidate]);
  return null;
}

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
 * inside-hull material swap (components/canvas/HeroStone.tsx flips to
 * BackSide once the camera's actual distance from the stone drops below its
 * radius) is how that's avoided instead of just hoping the camera never
 * gets close.
 */
export function CanvasRoot() {
  const later = useScroll((s) => s.scene >= 4);
  // z-0 (not a negative z-index): `body` in app/layout.tsx has its own
  // opaque background and no stacking context of its own, so a negative
  // z-index here would paint *behind* that background and never be visible
  // — a classic CSS trap. z-0 plus DOM order (this mounts before the DOM
  // text layer in SiteShell) is what actually keeps it behind the text.
  return (
    <div className="journey-canvas fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        frameloop={later ? "always" : "demand"}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ fov: 35, near: 0.01, far: 100, position: [0, 1.2, 9] }}
      >
        <ScrollFrames />
        <color attach="background" args={["#030403"]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
