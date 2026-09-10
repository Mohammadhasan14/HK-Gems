"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { HeroStone } from "./HeroStone";
import { Vitrine } from "./Vitrine";
import { BezelAssembly } from "./BezelAssembly";
import { MineralJourney } from "./MineralJourney";
import { RockyEnvironment } from "./RockyEnvironment";
import { useScroll } from "@/store/useScroll";

function LaterObjects() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current) ref.current.visible = useScroll.getState().scene >= 4; });
  return <group ref={ref} visible={false}>
    <HeroStone /><BezelAssembly /><Vitrine />
    <ContactShadows position={[0,-1.5,0]} opacity={.3} blur={2.4} far={3} scale={8} frames={1} />
  </group>;
}
export function Scene() {
  const later = useScroll((s) => s.scene >= 4);
  return <>
    <CameraRig />
    <ambientLight intensity={.13} />
    <directionalLight position={[-3,4,5]} color="#d4e4e4" intensity={3.8} />
    <directionalLight position={[2,4,-3]} color="#ffdda5" intensity={2.6} />
    <Environment resolution={128} frames={1}>
      <Lightformer position={[-3,4,4]} scale={[2,4,1]} intensity={2.5} color="#fff0d9" target={[0,0,0]} />
      <Lightformer position={[1,5,-2]} scale={[2,2,1]} intensity={3} color="#ffe1b2" target={[0,0,0]} />
      <Lightformer position={[4,0,3]} scale={[1,3,1]} intensity={.5} color="#adcfda" target={[0,0,0]} />
    </Environment>
    <MineralJourney /><RockyEnvironment />{later && <LaterObjects />}
  </>;
}
