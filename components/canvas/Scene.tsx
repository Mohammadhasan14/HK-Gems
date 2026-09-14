"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useScroll } from "@/store/useScroll";
import { smooth } from "@/lib/sceneTimeline";
import { CameraRig } from "./CameraRig";
import { MineralJourney } from "./MineralJourney";
import { RockyEnvironment } from "./RockyEnvironment";
function MineralLights() {
  const key=useRef<THREE.DirectionalLight>(null),edge=useRef<THREE.DirectionalLight>(null),fill=useRef<THREE.DirectionalLight>(null);
  useFrame(()=>{
    const phase=useScroll.getState().scene;
    if(key.current) key.current.intensity=1.35+smooth(2,4,phase)*.55;
    if(fill.current) fill.current.intensity=.15+smooth(4,5,phase)*1.5;
    if(edge.current){edge.current.intensity=1.4-smooth(3,5,phase)*.5;edge.current.position.x=2-smooth(0,1,phase)*3+smooth(1,3,phase)*2;}
  });
  return <><ambientLight intensity={.23}/>
    <directionalLight ref={key} position={[-3,4,5]} color="#e3eeec" intensity={1.35}/>
    <directionalLight ref={edge} position={[2,4,-3]} color="#d9e8e4" intensity={1.4}/>
    <directionalLight ref={fill} position={[-4,0,7]} color="#e7f0f2" intensity={.15}/>
  </>;
}
export function Scene() {
  return <>
    <CameraRig /><MineralLights />
    <Environment resolution={128} frames={1}>
      <Lightformer form="circle" position={[-4,4,5]} scale={[3,3,1]} intensity={1.7} color="#f1f5f5" target={[0,0,0]}/>
      <Lightformer form="circle" position={[1,5,-2]} scale={[3.5,2.5,1]} intensity={1.5} color="#e5eceb" target={[0,0,0]}/>
      <Lightformer form="circle" position={[4,0,4]} scale={[3,3,1]} intensity={1.1} color="#e7edee" target={[0,0,0]}/>
      <Lightformer position={[-2,-1,-4]} scale={[4,2,1]} intensity={1.1} color="#cbd6dc" target={[0,0,0]}/>
    </Environment>
    <MineralJourney /><RockyEnvironment />
  </>;
}
