"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { noise, mineralTexture } from "@/lib/mineral";
import { useScroll } from "@/store/useScroll";
import { smooth, stagePlacement } from "@/lib/sceneTimeline";

function terrainHeight(x: number, z: number) {
  const strata = 1 - Math.abs(noise(x * .64 + z * .37 + 10, z * .82, 4) * 2 - 1);
  const ridges = Math.abs(noise(x * 3.8 + z * 1.4, z * 5.1, 6) - .5);
  return strata ** 3 * .3 + ridges * .48
    + noise(x * 12, z * 13, 9) * .085 + noise(x * 35, z * 35, 2) * .023;
}
function makeTerrain() {
  const geometry = new THREE.PlaneGeometry(24, 18, 180, 140);
  geometry.rotateX(-Math.PI / 2);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * 8);
  const p = geometry.attributes.position, colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, terrainHeight(x, z));
    const fade = THREE.MathUtils.smoothstep(z, -4, 1) * Math.exp(-Math.pow(x / 11, 6));
    const shade = (.012 + noise(x * 6, z * 6, 12) * .028) * fade;
    colors.set([shade, shade * .86, shade * .69], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); return geometry;
}
function makeRockGeometry() {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, 4).deleteAttribute("normal"));
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = .75 + noise(x * 3, y * 5, z * 3) * .32 + noise(x * 19, y * 19, z * 19) * .06;
    // Broken slabs with angular cleavage, rather than rounded river pebbles.
    p.setXYZ(i, x * r, Math.min(.48, y * r) + Math.abs(noise(x * 13, y * 13, z * 13) - .5) * .22, z * r);
    geometry.attributes.uv.setXY(i, x * .5 + .5, z * .5 + .5);
  }
  geometry.computeVertexNormals(); return geometry;
}
/** Fade distant ground and its specular response into darkness, so no horizon
 * band crosses the copy. Instanced slabs and terrain share this world-space fade. */
function shadeTerrain(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = "varying vec3 vGroundPosition;\n" + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
    vec4 groundPosition = vec4(transformed, 1.);
    #ifdef USE_INSTANCING
      groundPosition = instanceMatrix * groundPosition;
    #endif
    vGroundPosition = (modelMatrix * groundPosition).xyz;
    #include <project_vertex>
  `);
  shader.fragmentShader = "varying vec3 vGroundPosition;\n" + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
    // World projection gives the flattened slabs the same photographic grain
    // scale as the ground, without the pinching of a spherical UV at the top.
    vec4 rockColor = texture2D(map, vGroundPosition.xz * .85);
    diffuseColor *= rockColor;
  `);
  shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", `
    float depthFade = smoothstep(-2., 1.4, vGroundPosition.z);
    float pool = .12 + .88 * exp(-dot((vGroundPosition.xz - vec2(1., .5)) * vec2(.38, .10),
      (vGroundPosition.xz - vec2(1., .5)) * vec2(.38, .10)));
    float crevice = mix(.18, 1., smoothstep(.008, .075, rockColor.r));
    outgoingLight *= depthFade * pool * crevice * .9;
    // Fading color alone leaves an opaque black silhouette across the shaft.
    // Let distant terrain dissolve into the atmosphere as well.
    diffuseColor.a *= depthFade;
    #include <opaque_fragment>
  `);
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
   float rays=.8+.035*sin(vUv.x*125.+y*3.)+.02*sin(vUv.x*277.-y*5.);
   float alpha=cone*smoothstep(0.,.10,y)*mix(.18,1.2,pow(y,1.1))*(rays*.4+haze*.6);
   gl_FragColor=vec4(vec3(.77,.60,.35),alpha);
 }
`;
export function RockyEnvironment() {
  const group = useRef<THREE.Group>(null), pedestal = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const assets = useMemo(() => {
    const target = new THREE.Object3D(); target.position.set(.9, -2, 0);
    const rock = makeRockGeometry();
    const albedo = mineralTexture("rock-albedo.png", true), height = mineralTexture("rock-albedo.png");
    const material = new THREE.MeshStandardMaterial({ color: "#a6a29a", map: albedo, roughness: .85, bumpMap: height, bumpScale: .3 });
    material.onBeforeCompile = shadeTerrain;
    material.customProgramCacheKey = () => "rock-distance-fade";
    const rocks = new THREE.InstancedMesh(rock, material, 210), transform = new THREE.Object3D();
    const rnd = (i: number) => { const n = Math.sin(i * 127.1 + 41.7) * 43758.5453; return n - Math.floor(n); };
    for (let i = 0; i < 210; i++) {
      const x = (rnd(i * 6) - .5) * 17, z = rnd(i * 6 + 1) * 8 - .2;
      transform.position.set(x, terrainHeight(x, z) - 2.38, z);
      const s = .08 + rnd(i * 6 + 2) ** 2 * .62;
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
    return { terrain: makeTerrain(), rock, material, albedo, height, dust, target, rocks };
  }, []);
  useEffect(() => () => {
    assets.terrain.dispose(); assets.dust.dispose(); assets.rock.dispose(); assets.material.dispose();
  }, [assets]);
  useFrame(() => {
    if (!group.current || !pedestal.current) return;
    const { scene } = useScroll.getState(), { mobile, centerY, scale } = stagePlacement(size.width, size.height, scene);
    group.current.position.set(mobile ? -.95 : 0, mobile ? centerY + 2.1 - scale * 1.65 : 0, 0);
    const raised = smooth(4, 5, scene);
    pedestal.current.position.set(1.05, -2.26 + raised * .56, .22);
    pedestal.current.scale.set(1.45 + raised * .45, .33 + raised * .4, 1.08 + raised * .25);
  });
  return <group ref={group} name="rocky-environment">
    <mesh geometry={assets.terrain} position={[0, -2.4, 0]} receiveShadow>
      <meshStandardMaterial transparent vertexColors map={assets.albedo} roughness={.83} bumpMap={assets.height} bumpScale={.28}
        onBeforeCompile={shadeTerrain} customProgramCacheKey={() => "rock-distance-fade"} />
    </mesh>
    <primitive object={assets.rocks} />
    <mesh ref={pedestal} geometry={assets.rock} material={assets.material} castShadow receiveShadow />
    <mesh position={[.4, 5.5, -5]}>
      <planeGeometry args={[11, 24]} />
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
      castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0002} shadow-normalBias={.02} shadow-radius={4} />
    <spotLight position={[.8, .1, -2.4]} target={assets.target} color="#f7d7a2" intensity={95} angle={.95} penumbra={1} />
  </group>;
}
