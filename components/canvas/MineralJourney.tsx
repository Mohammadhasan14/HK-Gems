"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeFragment, makeMineralGeometry, makeMineralMaterial, rawSurface } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { smooth, stagePlacement } from "@/lib/sceneTimeline";
import { SilverRing } from "./SilverRing";
const lerp = THREE.MathUtils.lerp;
const sample = (values: number[], phase: number) => {
  const i = Math.min(values.length - 1, Math.floor(phase));
  return lerp(values[i], values[Math.min(i + 1, values.length - 1)], phase - i);
};
const random = (i: number) => { const x = Math.sin(i * 173.31 + 31.7) * 43758.5453; return x - Math.floor(x); };
// Two cuts on the right shoulder, then a few heavier chips below the left face.
// The remaining small flakes follow those same cuts instead of encircling the core.
const CUTS = [[.68,.63,.42],[.89,.12,.43],[.45,.86,.3],[-.67,-.56,.48],[-.3,-.87,.44],[.6,-.5,.65]];
const FRAGMENTS = Array.from({length:22}, (_, i) => {
  const direction = new THREE.Vector3(...CUTS[i % CUTS.length] as [number,number,number]);
  if(i>=6) direction.add(new THREE.Vector3(random(i)-.5,random(i+17)-.5,random(i+27)-.5).multiplyScalar(.3));
  direction.normalize();
  const start = rawSurface(direction.x,direction.y,direction.z).multiplyScalar(.91);
  const distance = i<6 ? [.72,.94,.51,.53,.38,.65][i] : .4+random(i+70)*.9;
  const release = direction.clone().multiply(new THREE.Vector3(1.2,.65,.65)).multiplyScalar(distance);
  release.y += i<3 ? .14 : -.15-random(i+90)*.2;
  return { direction,start,release,scale:i<6?[.22,.18,.12,.21,.11,.14][i]:.026+random(i+15)*.047,delay:random(i+41)*.16 };
});
export function MineralJourney() {
  const { size } = useThree();
  const group = useRef<THREE.Group>(null), setting = useRef<THREE.Group>(null);
  const pose = useRef<THREE.Group>(null), stone = useRef<THREE.Mesh>(null);
  const pieces = useRef<(THREE.Mesh | null)[]>([]);
  const assets = useMemo(() => ({ stone: makeMineralGeometry(),
    chips: FRAGMENTS.map((f,i)=>makeFragment(i,f.direction)), body: makeMineralMaterial(true), chipMaterial: makeMineralMaterial(true) }), []);
  useEffect(() => () => { assets.stone.dispose(); assets.body.dispose(); assets.chipMaterial.dispose(); assets.chips.forEach(g => g.dispose()); }, [assets]);
  useFrame(() => {
    if (!group.current || !stone.current || !pose.current || !setting.current) return;
    const phase = useScroll.getState().scene;
    const placement = stagePlacement(size.width, size.height, phase);
    const carving=smooth(1,2,phase), refinement=smooth(2,3,phase), polished=smooth(3,4,phase), ring=smooth(4,5,phase);
    group.current.position.set(placement.mobile ? -.2 : sample([1.6,1.75,1.66,1.6,1.6,1.55],phase),placement.centerY,0);
    group.current.scale.setScalar(placement.scale * sample([.99,1.04,.97,.94,.96,1.03],phase));
    pose.current.rotation.set(sample([.12,-.16,.06,-.15,.025,.50],phase),
      sample([.2,-.52,-.15,.48,.1,-.85],phase), sample([-.1,.12,-.12,-.48,.025,-.42],phase));
    pose.current.position.y=sample([-.24,-.2,-.2,-.25,-.18,-.25],phase);
    stone.current.morphTargetInfluences![0]=carving*(1-refinement);
    stone.current.morphTargetInfluences![1]=refinement*(1-polished);
    stone.current.morphTargetInfluences![2]=polished;
    stone.current.scale.set(lerp(1,.76,ring),lerp(1,.76,ring),lerp(1,.32,ring));
    stone.current.position.z=ring*.12;
    const material=stone.current.material as THREE.MeshPhysicalMaterial;
    material.userData.raw.value=sample([1,1,.86,.45,0,0],phase);
    material.bumpScale=sample([.012,.012,.009,.004,.0008,.0008],phase);
    material.clearcoat=sample([.0001,.0001,.01,.06,.20,.20],phase);
    setting.current.visible=ring>.002;
    setting.current.scale.setScalar(Math.max(.001,ring));
    // Scroll time: fast initial release, gentle drift, then gravity and clearance.
    // Every trajectory is a pure function of phase, so reversing retraces it.
    const removal=smooth(2.04,2.85,phase);
    pieces.current.forEach((mesh,i)=>{
      if(!mesh)return;const f=FRAGMENTS[i];
      const release=smooth(1.03+f.delay,1.9,phase);
      const impulse=(1-Math.exp(-4*release))/(1-Math.exp(-4));
      mesh.visible=release>.008 && removal<.998;
      mesh.position.copy(f.start).addScaledVector(f.release,impulse+release*.12);
      mesh.position.y-=removal*(.55+random(i)*.65);
      mesh.position.x+=f.release.x*removal*.22;
      mesh.scale.setScalar(f.scale*(1-removal));
      mesh.rotation.set(i*.47+impulse*.72,i*.81+release*.65,i*.31-release*.8);
    });
    // Inspectable scene state also supports browser assertions of actual geometry.
    group.current.userData.phase=phase;
  });
  return <group ref={group} name="firoza-journey">
    <group ref={pose}>
      <mesh ref={stone} name="natural-turquoise" args={[assets.stone,assets.body]} castShadow receiveShadow />
      <group ref={setting} visible={false}><SilverRing /></group>
      {FRAGMENTS.map((_,i)=><mesh key={i} name={`carving-fragment-${i}`} ref={mesh=>{pieces.current[i]=mesh;}}
        geometry={assets.chips[i]} material={assets.chipMaterial} visible={false} castShadow />)}
    </group>
  </group>;
}
