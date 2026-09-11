"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";

class BezelCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private radius: number, private depth: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2, y = Math.sin(angle);
    return target.set(Math.cos(angle) * .81 * (1 - y * .10) * this.radius,
      y * 1.37 * this.radius, this.depth);
  }
}
/** A silver cabochon setting: continuous bezel, rolled rims and split shoulders. */
export function SilverRing() {
  const assets = useMemo(() => {
    const rim = new THREE.TubeGeometry(new BezelCurve(1.02, .10), 128, .039, 10, true);
    const outerRim = new THREE.TubeGeometry(new BezelCurve(1.075, -.07), 128, .045, 10, true);
    const bezel = new THREE.TubeGeometry(new BezelCurve(1.045, .01), 128, .095, 12, true);
    const shank = new THREE.TorusGeometry(.92, .115, 20, 128);
    const silver = new THREE.MeshPhysicalMaterial({ color: "#d3d9dc", metalness: 1, roughness: .19,
      clearcoat: .2, envMapIntensity: 1.5 });
    const shoulders = [-1, 1].flatMap(side => [-1, 1].map(branch => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * .68, branch * .63, -.10),
        new THREE.Vector3(side * .90, branch * .35, -.46),
        new THREE.Vector3(side * .90, 0, -.94),
      ]);
      return new THREE.TubeGeometry(curve, 32, .055, 10, false);
    }));
    return { rim, outerRim, bezel, shank, silver, shoulders };
  }, []);
  useEffect(() => () => {
    assets.rim.dispose(); assets.outerRim.dispose(); assets.bezel.dispose(); assets.shank.dispose();
    assets.silver.dispose(); assets.shoulders.forEach(s => s.dispose());
  }, [assets]);
  return <group name="silver-setting">
    <mesh geometry={assets.bezel} material={assets.silver} castShadow />
    <mesh geometry={assets.rim} material={assets.silver} castShadow />
    <mesh geometry={assets.outerRim} material={assets.silver} castShadow />
    <mesh geometry={assets.shank} material={assets.silver} rotation={[Math.PI / 2, 0, 0]}
      position={[0, -.12, -.94]} scale={[1, 1, 1.35]} castShadow />
    {assets.shoulders.map((geometry, i) => <mesh key={i} geometry={geometry} material={assets.silver} castShadow />)}
  </group>;
}
