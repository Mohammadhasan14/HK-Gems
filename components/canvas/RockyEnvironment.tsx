"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { noise } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { mobileStageOffset } from "@/lib/sceneTimeline";

function terrainHeight(x: number, z: number) {
  return Math.abs(noise(x * .7 + 10, z * .9, 4) - .5) * 1.0
    + noise(x * 1.7, z * 2.3, 6) * .26
    + noise(x * 5, z * 6, 9) * .16 + noise(x * 14, z * 14, 2) * .06;
}

function makeTerrain() {
  const geometry = new THREE.PlaneGeometry(22, 10, 240, 170);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, 3);
  const p = geometry.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, terrainHeight(x, z));
    const fade = THREE.MathUtils.smoothstep(z, -2, 0) * Math.exp(-Math.pow((x - .9) / 5.5, 4));
    const shade = (.005 + noise(x * 3, z * 3, 12) * .009) * fade;
    color.setRGB(shade, shade * .79, shade * .58);
    colors.set(color.toArray(), i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeRocks(grain: THREE.Texture) {
  const geometry = new THREE.IcosahedronGeometry(1, 6);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = .78 + noise(x * 5, y * 5, z * 5) * .42;
    p.setXYZ(i, x * r, y * r, z * r);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: "#353129", map: grain, roughness: .94, bumpMap: grain, bumpScale: .06 });
  const mesh = new THREE.InstancedMesh(geometry, material, 65);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 65; i++) {
    const rnd = (seed: number) => { const n = Math.sin(seed * 117.3 + i * 43.9) * 43758.5453; return n - Math.floor(n); };
    const x = (rnd(1) - .5) * 13, z = rnd(2) * 8 - 1.5;
    transform.position.set(x, terrainHeight(x, z) - 2.8, z);
    transform.scale.set(.2 + rnd(3) * 1.05, .07 + rnd(4) * .18, .16 + rnd(5) * .53);
    transform.rotation.set(rnd(6) * .2, rnd(7) * Math.PI, rnd(8) * .2);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
  }
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makeGrain() {
  const size = 512, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const n = noise(x / 8, y / 8, 5) * .6 + noise(x / 2, y / 2, 8) * .4;
    data[i] = data[i + 1] = data[i + 2] = n * 255;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 8);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const shaftFragment = /* glsl */`
 varying vec2 vUv;
 void main() {
   float y=vUv.y;
   float center=.52-(y-.5)*.16;
   float width=mix(.43,.17,y);
   float cone=exp(-pow(abs(vUv.x-center)/width,2.6)*2.);
   float rays=.94+.04*sin(vUv.x*130.+y*4.)+.02*sin(vUv.x*263.-y*8.);
   float fade=smoothstep(0.,.13,y);
   float alpha=cone*fade*mix(.025,.62,pow(y,1.3))*rays;
   gl_FragColor=vec4(vec3(.88,.72,.48),alpha);
 }
`;

export function RockyEnvironment() {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const assets = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(.9, -2.6, -.7);
    const random = (i: number) => { const n = Math.sin(i * 127.1 + 41.7) * 43758.5453; return n - Math.floor(n); };
    const positions = [], colors = [];
    for (let i = 0; i < 630; i++) {
      const y = random(i * 3) * 7 - 2;
      const spread = 1.2 + (5 - y) * .14;
      const x = .9 + (random(i * 3 + 1) - .5) * spread * 2;
      positions.push(x, y, -1.5 - random(i * 3 + 2) * 2.5);
      const brightness = (.3 + random(i + 900) * .6) * Math.exp(-Math.pow((x - .9) / spread, 2) * 2);
      colors.push(brightness, brightness * .69, brightness * .35);
    }
    const dust = new THREE.BufferGeometry();
    dust.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    dust.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const grain = makeGrain();
    return { terrain: makeTerrain(), grain, dust, target, rocks: makeRocks(grain) };
  }, []);
  useEffect(() => () => {
    assets.terrain.dispose(); assets.grain.dispose(); assets.dust.dispose();
    assets.rocks.geometry.dispose(); (assets.rocks.material as THREE.Material).dispose();
  }, [assets]);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = useScroll.getState().scene < 4;
    group.current.position.x = size.width < 700 ? -.9 : 0;
    group.current.position.y = mobileStageOffset(size.width, size.height);
  });
  return <group ref={group} name="rocky-environment">
    <mesh geometry={assets.terrain} position={[0, -2.8, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={.97} bumpMap={assets.grain} bumpScale={.18} />
    </mesh>
    <primitive object={assets.rocks} />
    <mesh position={[.5, 1.65, -4]}>
      <planeGeometry args={[9, 10]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending}
        vertexShader={"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"}
        fragmentShader={shaftFragment} />
    </mesh>
    <points geometry={assets.dust}>
      <shaderMaterial transparent depthWrite={false} vertexColors blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */`varying vec3 vColor; void main(){vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(18./-mv.z,.8,2.2);}`}
        fragmentShader={/* glsl */`varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vColor,(1.-smoothstep(.08,.5,d))*.85);}`} />
    </points>
    <primitive object={assets.target} />
    <spotLight position={[.65, 6, 1.2]} target={assets.target} color="#ffe1ac"
      intensity={280} angle={.36} penumbra={.85} castShadow shadow-mapSize={[1024,1024]}
      shadow-bias={-.0003} shadow-normalBias={.025} shadow-radius={5} />
    <spotLight position={[.9, -.7, -1.7]} target={assets.target} color="#ffcd88"
      intensity={65} angle={.8} penumbra={1} />
  </group>;
}
