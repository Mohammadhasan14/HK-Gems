"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeFragment, makeMineralGeometry, makeMineralMaterial } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { smooth, stagePlacement } from "@/lib/sceneTimeline";
import { SilverRing } from "./SilverRing";

const lerp = THREE.MathUtils.lerp;
const sample = (values: number[], phase: number) => {
  const i = Math.min(values.length - 1, Math.floor(phase));
  return lerp(values[i], values[Math.min(i + 1, values.length - 1)], phase - i);
};
const random = (i: number) => { const x = Math.sin(i * 173.31 + 31.7) * 43758.5453; return x - Math.floor(x); };
// Deliberate loose radial arrangement: larger chips sit outside the central silhouette.
const FRAGMENTS = Array.from({ length: 34 }, (_, i) => {
  const angle = i * 2.39996;
  const radius = 1.25 + random(i) * .62;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 1.05 + .17,
    z: -.18 + random(i + 55) * .5, scale: i < 13 ? .12 + random(i + 10) * .15 : .035 + random(i + 8) * .075 };
});
export function MineralJourney() {
  const { size } = useThree();
  const group = useRef<THREE.Group>(null), setting = useRef<THREE.Group>(null);
  const pose = useRef<THREE.Group>(null), stone = useRef<THREE.Mesh>(null);
  const pieces = useRef<(THREE.Mesh | null)[]>([]);
  const assets = useMemo(() => ({ stone: makeMineralGeometry(),
    chips: [0, 1, 2, 3].map(makeFragment), body: makeMineralMaterial(true), chipMaterial: makeMineralMaterial(true) }), []);
  useEffect(() => () => { assets.stone.dispose(); assets.body.dispose(); assets.chipMaterial.dispose(); assets.chips.forEach(g => g.dispose()); }, [assets]);
  useFrame(() => {
    if (!group.current || !stone.current || !pose.current || !setting.current) return;
    const phase = useScroll.getState().scene;
    const placement = stagePlacement(size.width, size.height, phase);
    const polish = smooth(2, 3, phase), carved = smooth(1, 2, phase) * (1 - polish);
    const ring = smooth(4, 5, phase);
    group.current.position.set(placement.mobile ? -.1 : sample([.98, .93, .96, .8, 1.04, 1.12], phase), placement.centerY, 0);
    group.current.scale.setScalar(placement.scale * sample([1.04, 1.16, 1.03, 1.03, 1.07, .94], phase));
    pose.current.rotation.set(sample([.06, -.07, .06, .04, .02, .12], phase),
      sample([.12, .60, .48, .16, .09, -.85], phase), sample([-.09, -.39, -.16, -.27, .015, -.52], phase));
    pose.current.position.y = sample([-.40, -.25, -.16, -.24, -.14, .17], phase);
    stone.current.morphTargetInfluences![0] = carved;
    stone.current.morphTargetInfluences![1] = polish;
    stone.current.scale.set(1, sample([1, .93, 1, 1, 1, 1], phase), lerp(1, .37, ring));
    stone.current.position.z = ring * .13;
    const material = stone.current.material as THREE.MeshPhysicalMaterial;
    material.userData.raw.value = 1 - polish;
    material.bumpScale = lerp(.035, .004, polish);
    material.clearcoat = lerp(.025, .35, polish);
    setting.current.visible = ring > .002;
    setting.current.scale.setScalar(Math.max(.001, ring));
    // Outward movement is tied to the same phase as the carved morph, and reverses exactly.
    const explosion = smooth(1, 2, phase);
    const removal = smooth(2.15, 2.9, phase);
    pieces.current.forEach((mesh, i) => {
      if (!mesh) return;
      const f = FRAGMENTS[i];
      const looseDiscovery = i < 3 ? smooth(.4, 1, phase) * (1 - explosion) : 0;
      const visible = Math.max(explosion * (1 - removal), looseDiscovery);
      mesh.visible = visible > .005;
      const spread = explosion * (1 + removal * .35);
      mesh.position.set(lerp(.35 + f.x * .3, f.x, spread), lerp(f.y * .4, f.y, spread) - removal * .5, f.z);
      if (looseDiscovery > .5) mesh.position.set(1.35 + i * .13, -.45 - i * .4, -.2);
      mesh.scale.setScalar(f.scale * visible);
      mesh.rotation.set(i * .71 + spread * .4, i * 1.13 + spread * .5, i * .51 - spread * .3);
    });
  });
  return <group ref={group} name="firoza-journey">
    <group ref={pose}>
      <mesh ref={stone} name="natural-turquoise" args={[assets.stone, assets.body]} castShadow receiveShadow />
      <group ref={setting} visible={false}><SilverRing /></group>
    </group>
    {FRAGMENTS.map((_, i) => <mesh key={i} name={`carving-fragment-${i}`}
      ref={mesh => { pieces.current[i] = mesh; }} geometry={assets.chips[i % 4]} material={assets.chipMaterial} visible={false} castShadow />)}
  </group>;
}
