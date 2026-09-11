"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { noise } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { smooth, stagePlacement } from "@/lib/sceneTimeline";

function terrainHeight(x: number, z: number) {
  const strata = 1 - Math.abs(noise(x * .64 + z * .37 + 10, z * .82, 4) * 2 - 1);
  const ridges = Math.abs(noise(x * 3.8 + z * 1.4, z * 5.1, 6) - .5);
  return strata ** 3 * .59 + ridges * .38
    + noise(x * 12, z * 13, 9) * .085 + noise(x * 35, z * 35, 2) * .023;
}
function makeTerrain() {
  const geometry = new THREE.PlaneGeometry(24, 22, 260, 240);
  geometry.rotateX(-Math.PI / 2);
  const p = geometry.attributes.position, colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, terrainHeight(x, z));
    const fade = THREE.MathUtils.smoothstep(z, -9, -1) * Math.exp(-Math.pow(x / 11, 6));
    const shade = (.018 + noise(x * 6, z * 6, 12) * .035) * fade;
    colors.set([shade, shade * .86, shade * .69], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); return geometry;
}
function makeRockGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 5);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = .75 + noise(x * 3, y * 5, z * 3) * .32 + noise(x * 19, y * 19, z * 19) * .06;
    // Broken slabs with angular cleavage, rather than rounded river pebbles.
    p.setXYZ(i, x * r, Math.min(.48, y * r) + Math.abs(noise(x * 8, y * 8, z * 8) - .5) * .1, z * r);
  }
  geometry.computeVertexNormals(); return geometry;
}
function makeGrain() {
  const size = 512, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const field = noise(x / 29, y / 14, 2);
    const crack = 1 - smooth(.015, .045, Math.abs(field - .5));
    const n = noise(x / 5, y / 5, 5) * .45 + noise(x / 1.4, y / 1.4, 8) * .3 + .25 - crack * .4;
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, n * 255); data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 7);
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true; return texture;
}
const shaftFragment = /* glsl */`
 varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main() {
   float y=vUv.y, center=.54-(y-.5)*.10;
   float width=mix(.34,.12,y);
   float cone=exp(-pow(abs(vUv.x-center)/width,2.)*2.);
   float haze=noise(vUv*vec2(13.,5.))*.55+noise(vUv*vec2(29.,14.))*.25+.2;
   float rays=.62+.19*sin(vUv.x*125.+y*3.)+.1*sin(vUv.x*277.-y*5.);
   float alpha=cone*smoothstep(0.,.10,y)*mix(.10,.76,pow(y,1.1))*(rays*.4+haze*.6);
   gl_FragColor=vec4(vec3(.72,.55,.30),alpha);
 }
`;
export function RockyEnvironment() {
  const group = useRef<THREE.Group>(null), pedestal = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const assets = useMemo(() => {
    const target = new THREE.Object3D(); target.position.set(.9, -2, 0);
    const grain = makeGrain(), rock = makeRockGeometry();
    const material = new THREE.MeshStandardMaterial({ color: "#4d4940", map: grain, roughness: .68, bumpMap: grain, bumpScale: .12 });
    const rocks = new THREE.InstancedMesh(rock, material, 210), transform = new THREE.Object3D();
    const rnd = (i: number) => { const n = Math.sin(i * 127.1 + 41.7) * 43758.5453; return n - Math.floor(n); };
    for (let i = 0; i < 210; i++) {
      const x = (rnd(i * 6) - .5) * 17, z = rnd(i * 6 + 1) * 14 - 6;
      transform.position.set(x, terrainHeight(x, z) - 2.38, z);
      const s = .12 + rnd(i * 6 + 2) ** 2 * .72;
      transform.scale.set(s * 1.5, s * .40, s * .8);
      transform.rotation.set(rnd(i * 6 + 3) * .5, rnd(i * 6 + 4) * 6, rnd(i * 6 + 5) * .3);
      transform.updateMatrix(); rocks.setMatrixAt(i, transform.matrix);
    }
    rocks.castShadow = rocks.receiveShadow = true;
    const positions = [], colors = [];
    for (let i = 0; i < 240; i++) {
      const y = rnd(i * 3) * 7 - 2, spread = .7 + (5 - y) * .13;
      const x = .8 + (rnd(i * 3 + 1) - .5) * spread * 2;
      positions.push(x, y, -1 - rnd(i * 3 + 2) * 3);
      const brightness = (.16 + rnd(i + 900) * .42) * Math.exp(-Math.pow((x - .8) / spread, 2) * 2);
      colors.push(brightness, brightness * .72, brightness * .42);
    }
    const dust = new THREE.BufferGeometry();
    dust.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); dust.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return { terrain: makeTerrain(), rock, material, grain, dust, target, rocks };
  }, []);
  useEffect(() => () => {
    assets.terrain.dispose(); assets.grain.dispose(); assets.dust.dispose(); assets.rock.dispose(); assets.material.dispose();
  }, [assets]);
  useFrame(() => {
    if (!group.current || !pedestal.current) return;
    const { scene } = useScroll.getState(), { mobile, centerY, scale } = stagePlacement(size.width, size.height);
    group.current.position.set(mobile ? -.95 : 0, mobile ? centerY + 2.1 - scale * 1.65 : 0, 0);
    const raised = smooth(4, 5, scene);
    pedestal.current.position.set(1.05, -2.26 + raised * .21, .22);
    pedestal.current.scale.set(1.45 + raised * .4, .33 + raised * .3, 1.08 + raised * .1);
  });
  return <group ref={group} name="rocky-environment">
    <mesh geometry={assets.terrain} position={[0, -2.4, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={.72} bumpMap={assets.grain} bumpScale={.22} />
    </mesh>
    <primitive object={assets.rocks} />
    <mesh ref={pedestal} geometry={assets.rock} material={assets.material} castShadow receiveShadow />
    <mesh position={[.4, 1.7, -5]}>
      <planeGeometry args={[11, 11]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending}
        vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader={shaftFragment} />
    </mesh>
    <points geometry={assets.dust}>
      <shaderMaterial transparent depthWrite={false} vertexColors blending={THREE.AdditiveBlending}
        vertexShader="varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(14./-mv.z,.7,1.5);}"
        fragmentShader="varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vColor,(1.-smoothstep(.06,.5,d))*.65);}" />
    </points>
    <primitive object={assets.target} />
    <spotLight position={[.1, 6, 1]} target={assets.target} color="#ffe1aa" intensity={330} angle={.39} penumbra={.8}
      castShadow shadow-mapSize={[2048,2048]} shadow-bias={-.0002} shadow-normalBias={.02} shadow-radius={4} />
    <spotLight position={[.8, .1, -2.4]} target={assets.target} color="#f7d7a2" intensity={95} angle={.95} penumbra={1} />
  </group>;
}
