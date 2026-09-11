"use client";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stagePlacement } from "@/lib/sceneTimeline";
/** Fixed lens: geometry and craft change, never a flight through the stone. */
export function CameraRig() {
  const { size } = useThree();
  useFrame(({ camera }) => {
    const { worldWidth } = stagePlacement(size.width, size.height);
    const lens = camera as THREE.PerspectiveCamera;
    lens.fov = THREE.MathUtils.radToDeg(2 * Math.atan(worldWidth / (size.width / size.height) / 20));
    lens.position.set(0, 1.1, 10); lens.lookAt(0, 0, 0); lens.updateProjectionMatrix();
  }, -1);
  return null;
}
