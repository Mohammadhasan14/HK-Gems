"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";

class BezelCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private radius: number, private depth: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2, y = Math.sin(angle);
    return target.set(Math.cos(angle) * .86 * .76 * (1 - y * .025) * this.radius,
      y * 1.18 * .76 * this.radius, this.depth);
  }
}
/** A silver cabochon setting: continuous bezel, rolled rims and split shoulders. */
export function SilverRing() {
  const assets = useMemo(() => {
    const rim = new THREE.TubeGeometry(new BezelCurve(1.02, .10), 128, .039, 10, true);
    const outerRim = new THREE.TubeGeometry(new BezelCurve(1.075, -.07), 128, .045, 10, true);
    const bezel = new THREE.TubeGeometry(new BezelCurve(1.045, .01), 128, .095, 12, true);
    const shank = new THREE.TorusGeometry(.88, .095, 20, 128);
    const silver = new THREE.MeshPhysicalMaterial({ color: "#e0e3e5", metalness: 1, roughness: .23,
      clearcoat: .06, envMapIntensity: 1.35 });
    const shoulders = [-1, 1].flatMap(side => [-1, 1].map(branch => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * .51, branch * .44, -.10),
        new THREE.Vector3(side * .77, branch * .29, -.42),
        new THREE.Vector3(side * .87, 0, -.84),
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
      position={[0, -.10, -.84]} scale={[1, 1, 1.18]} castShadow />
    {assets.shoulders.map((geometry, i) => <mesh key={i} geometry={geometry} material={assets.silver} castShadow />)}
  </group>;
}
