"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeCutPiece, makeMineralGeometry, makeMineralMaterial } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { smooth, mobileStageOffset } from "@/lib/sceneTimeline";

export function MineralJourney() {
  const { size } = useThree();
  const group = useRef<THREE.Group>(null);
  const stone = useRef<THREE.Mesh>(null);
  const pieces = useRef<(THREE.Mesh | null)[]>([]);
  const assets = useMemo(() => ({
    stone: makeMineralGeometry(), piece: makeCutPiece(),
    body: makeMineralMaterial(true), cut: makeMineralMaterial(false, true),
  }), []);
  useEffect(() => () => { Object.values(assets).forEach((asset) => asset.dispose()); }, [assets]);

  useFrame(() => {
    if (!group.current || !stone.current) return;
    const phase = useScroll.getState().scene;
    group.current.visible = phase < 4;
    const mobile = size.width < 700;
    const shortScreenOffset = mobileStageOffset(size.width, size.height);
    const polish = Math.min(1, phase);
    const explosion = smooth(1, 2, phase) * (1 - smooth(2, 3, phase));
    const scale = mobile ? 0.93 : 1.17;
    const centerX = phase < 1 ? THREE.MathUtils.lerp(.58, 1.05, phase) : THREE.MathUtils.lerp(1.05, .8, Math.min(1, phase - 1));
    const finished = smooth(2, 3, phase);
    group.current.position.set(mobile ? 0.05 : centerX, mobile ? -.55 + shortScreenOffset : THREE.MathUtils.lerp(.02, .08, polish) + finished * .15, 0);
    group.current.scale.setScalar(scale);
    // A small yaw and tilt preserve the text column throughout the morph.
    const tilt = phase < 1 ? THREE.MathUtils.lerp(-.19, -.37, phase)
      : phase < 2 ? THREE.MathUtils.lerp(-.37, -.06, phase - 1)
      : THREE.MathUtils.lerp(-.06, -.13, Math.min(1, phase - 2));
    stone.current.rotation.set(.02, .12 + Math.min(phase, 3) * .065, tilt);
    stone.current.scale.setScalar(1 - explosion * 0.27);
    stone.current.scale.y *= 1 - finished * .12;
    stone.current.morphTargetInfluences![0] = polish;
    const material = stone.current.material as THREE.MeshPhysicalMaterial;
    material.userData.raw.value = 1 - polish;
    material.roughness = 1;
    material.bumpScale = THREE.MathUtils.lerp(.035, .003, polish);
    material.clearcoat = THREE.MathUtils.lerp(.2, .48, polish);
    // Each shard is a complete independent mesh. The settled cut always has five pieces.
    const offsets = [[0, 1.42, 0], [0, -1.45, 0], [-1, 0, 0.02], [1, 0, 0.02]];
    pieces.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.visible = explosion > 0.01;
      const [x,y,z] = offsets[i];
      mesh.position.set(x * explosion, y * explosion, z);
      mesh.scale.set(i < 2 ? 0.5 : 0.77, i < 2 ? 0.64 : 0.60, 0.72);
      mesh.scale.multiplyScalar(explosion);
      mesh.rotation.set(i < 2 ? 0.18 : 0, 0.05, i === 0 ? 0 : i === 1 ? Math.PI : i === 2 ? Math.PI / 2 : -Math.PI / 2);
    });
  });
  return <group ref={group} name="mineral-journey">
    <mesh ref={stone} name="central-mineral" args={[assets.stone, assets.body]} castShadow receiveShadow />
    {["top", "bottom", "left", "right"].map((name, i) => <mesh key={name} name={`cut-${name}`}
      ref={(mesh) => { pieces.current[i] = mesh; }} geometry={assets.piece} material={assets.cut} visible={false} castShadow />)}
  </group>;
}
