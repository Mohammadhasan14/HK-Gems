"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Scene } from "./Scene";
import { useScroll } from "@/store/useScroll";
import * as THREE from "three";
function ScrollFrames() {
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    const off = useScroll.subscribe((state, previous) => { if (state.scene !== previous.scene) invalidate(); });
    const loaded = () => invalidate();
    window.addEventListener("mineral-texture-ready", loaded);
    return () => { off(); window.removeEventListener("mineral-texture-ready", loaded); };
  }, [invalidate]);
  return null;
}
/** Compile even initially hidden fragments and silver before the user reaches
 * them. Waiting two frames lets the local reflection environment initialize. */
function ShaderWarmup() {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let cancelled = false, frame = 0;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        void gl.compileAsync(scene, camera).then(() => { if (!cancelled) invalidate(); });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [gl, scene, camera, invalidate]);
  return null;
}
export function CanvasRoot() {
  return <div className="journey-canvas" aria-hidden="true">
    <Canvas shadows={{ type: THREE.PCFShadowMap }} frameloop="demand"
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} dpr={[1, 1.5]}
      camera={{ fov: 35, near: .1, far: 60, position: [0, 1.1, 10] }}>
      <ScrollFrames /><color attach="background" args={["#030302"]} />
      <Suspense fallback={null}><Scene /><ShaderWarmup /></Suspense>
    </Canvas>
  </div>;
}
