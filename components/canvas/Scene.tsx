"use client";
import { Environment, Lightformer } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { MineralJourney } from "./MineralJourney";
import { RockyEnvironment } from "./RockyEnvironment";
export function Scene() {
  return <>
    <CameraRig />
    <ambientLight intensity={.15} />
    <directionalLight position={[-3, 5, 5]} color="#e5eeec" intensity={2.5} />
    <directionalLight position={[1, 5, -3]} color="#ffe0af" intensity={3.6} />
    <Environment resolution={128} frames={1}>
      <Lightformer position={[-4, 4, 5]} scale={[1.3, 4, 1]} intensity={3} color="#fff7ea" target={[0,0,0]} />
      <Lightformer position={[1, 5, -2]} scale={[3, 1, 1]} intensity={3.5} color="#ffe8c5" target={[0,0,0]} />
      <Lightformer position={[4, 0, 4]} scale={[.8, 4, 1]} intensity={2.5} color="#f1f5f5" target={[0,0,0]} />
    </Environment>
    <MineralJourney /><RockyEnvironment />
  </>;
}
