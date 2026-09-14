import * as THREE from "three";

export function noise(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const f = (t: number) => t * t * (3 - 2 * t);
  const fx = f(x - ix), fy = f(y - iy), fz = f(z - iz);
  let v = 0;
  for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const n = Math.sin((ix + i) * 127.1 + (iy + j) * 311.7 + (iz + k) * 74.7) * 43758.5453;
    v += (n - Math.floor(n)) * (i ? fx : 1 - fx) * (j ? fy : 1 - fy) * (k ? fz : 1 - fz);
  }
  return v;
}

/** The same surface coordinates locate the raw shell and each removed chip. */
export function rawSurface(x: number, y: number, z: number) {
  const n = (f: number) => noise(x * f + 5.2, y * f + 3.1, z * f + 7.8) - .5;
  const relief = 1 + n(3) * .25 + n(8) * .13 + Math.abs(n(17)) * .085 - Math.abs(n(39)) * .035;
  const clipping = Math.max(1, (x * .63 + y * .72 + z * .12) / .94,
    (-x * .5 + y * .76 + z * .2) / .93, (x * .25 - y * .91 + z * .33) / 1.02);
  return new THREE.Vector3(x * (1 - y * .13), y * 1.27, z * .79).multiplyScalar(relief / clipping);
}

/** A shared lattice preserves the mineral pattern through three different
 * shape targets: plane-carved, partly lapped, and the finished oval. */
export function makeMineralGeometry() {
  const geometry = new THREE.SphereGeometry(1, 128, 88);
  const raw = geometry.attributes.position as THREE.BufferAttribute;
  const carved = raw.clone(), refined = raw.clone(), polished = raw.clone();
  for (let i = 0; i < raw.count; i++) {
    const x = raw.getX(i), y = raw.getY(i), z = raw.getZ(i);
    const n = (f: number) => noise(x * f + 5.2, y * f + 3.1, z * f + 7.8) - .5;
    const point = rawSurface(x, y, z); raw.setXYZ(i, point.x, point.y, point.z);
    const cx = x * .89, cy = y * 1.35, cz = z * .7;
    const clipping = Math.max(1, (cx * .8 + cy * .36 + cz * .35) / .82,
      (-cx * .85 + cy * .24 + cz * .25) / .83, (-cx * .4 - cy * .58 + cz * .35) / .87,
      (cx * .65 + cz * .84) / .56, (-cx * .32 + cz * .95) / .59,
      (cx * .42 + cy * .62 + cz * .28) / .78);
    const grit = 1 + n(19) * .028 + n(55) * .015;
    carved.setXYZ(i, cx / clipping * grit, cy / clipping * grit, cz / clipping * grit);
    // A broader, asymmetric preform retains shallow tool planes and an uneven
    // shoulder. It is not the final oval with a different rotation.
    const shoulder = 1 + n(5) * .065 + n(17) * .009;
    const px = Math.sign(x) * Math.abs(x) ** .9 * .94 * (1 - y * .05);
    const py = Math.min(y * 1.26, 1.11 + x * .14), pz = z * .60;
    const lap = Math.max(1, (px * .62 + py * .33 + pz * .76) / .78,
      (-px * .48 + py * .44 + pz * .70) / .80);
    refined.setXYZ(i, px / lap * shoulder, py / lap * shoulder, pz / lap * shoulder);
    polished.setXYZ(i, x * .81 * (1 - y * .08), y * 1.22, z * .55);
  }
  geometry.computeVertexNormals();
  geometry.morphAttributes.position = [carved, refined, polished];
  geometry.morphAttributes.normal = [carved, refined, polished].map(position => {
    const target = new THREE.BufferGeometry(); target.setIndex(geometry.index);
    target.setAttribute("position", position); target.computeVertexNormals();
    const normals = target.attributes.normal.clone(); target.dispose(); return normals;
  });
  geometry.computeBoundingSphere();
  return geometry;
}

/** Closed cleavage chips sample a small UV patch around their actual origin. */
export function makeFragment(seed: number, surface: THREE.Vector3) {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const p = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = .7 + noise(x * 3 + seed, y * 3, z * 3) * .5;
    p.setXYZ(i, x * r * .83, y * r * 1.15, z * r * .42);
    const source = surface.clone().add(new THREE.Vector3(x, y, z).multiplyScalar(.09)).normalize();
    const u = Math.atan2(source.z, -source.x) / (2 * Math.PI);
    uv.setXY(i, u < 0 ? u + 1 : u, .5 + Math.asin(source.y) / Math.PI);
  }
  geometry.computeVertexNormals(); return geometry;
}

const textureCache = new Map<string, THREE.Texture>();
export function mineralTexture(name: string, color = false) {
  const key = `${name}-${color}`;
  if (!textureCache.has(key)) {
    const map = new THREE.TextureLoader().load(`/materials/${name}`, () => window.dispatchEvent(new Event("mineral-texture-ready")));
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
    textureCache.set(key, map);
  }
  return textureCache.get(key)!;
}

const mineralField = /* glsl */`
 uniform float uRaw;
 float mineralHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
 float mineralNoise(vec2 p) {
   vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(mineralHash(i),mineralHash(i+vec2(1,0)),f.x),mix(mineralHash(i+vec2(0,1)),mineralHash(i+vec2(1,1)),f.x),f.y);
 }
 float mineralFbm(vec2 p) { return mineralNoise(p)*.57+mineralNoise(p*2.03+7.)*.28+mineralNoise(p*4.1+17.)*.15; }
`;

export function makeMineralMaterial(raw: boolean) {
  const material = new THREE.MeshPhysicalMaterial({
    map: mineralTexture("firoza-albedo.png", true), bumpMap: mineralTexture("firoza-albedo.png"),
    bumpScale: raw ? .025 : .002, roughness: raw ? .85 : .3,
    metalness: 0, clearcoat: .04, clearcoatRoughness: .35,
    transmission: 0, envMapIntensity: .35,
  });
  const rawUniform = { value: raw ? 1 : 0 };
  material.userData.raw = rawUniform;
  material.onBeforeCompile = shader => {
    shader.uniforms.uRaw = rawUniform;
    shader.fragmentShader = mineralField + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #include <map_fragment>
      vec2 mineralUv = vMapUv * vec2(1.,.68);
      float mineralBlue = smoothstep(.015, .15, diffuseColor.b - diffuseColor.r);
      vec2 warped = mineralUv * 43. + vec2(mineralFbm(mineralUv*15.), mineralFbm(mineralUv*17.+31.))*3.;
      float grain = mineralFbm(mineralUv*220.);
      float fineGrain = mineralNoise(mineralUv*850.);
      float veins = 1.-smoothstep(.007,.029,abs(mineralFbm(warped)-.51));
      float branches = (1.-smoothstep(.004,.017,abs(mineralFbm(warped*2.+11.)-.48))) * smoothstep(.46,.67,mineralFbm(warped*.63));
      float matrix = clamp((1.-mineralBlue)*(.42+grain*.55)+veins*.68+branches*.43,0.,.96);
      vec3 mineral = mix(vec3(.012,.20,.255),vec3(.024,.295,.34),grain);
      // Retain the larger source pattern, but suppress its cloudy white areas.
      mineral = mix(mineral, diffuseColor.rgb*vec3(.65,.88,.94), .22);
      vec3 host = mix(vec3(.020,.024,.019),vec3(.12,.083,.040),mineralFbm(warped*.34));
      diffuseColor.rgb = mix(mineral,host,matrix) * (.91+fineGrain*.14);
      float mineralRelief = (grain*.7+fineGrain*.3-matrix*.18)*mix(.001,.018,uRaw);
    `).replace("#include <roughnessmap_fragment>", `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(.29+matrix*.13, .79+matrix*.13, uRaw);
    `).replace("#include <normal_fragment_maps>", `
      #include <normal_fragment_maps>
      normal = perturbNormalArb(-vViewPosition, normal, vec2(dFdx(mineralRelief),dFdy(mineralRelief)), faceDirection);
    `);
  };
  material.customProgramCacheKey = () => "hk-firoza-mineral-grain-v5";
  return material;
}
