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

/** One high-resolution lattice: rough, hand-carved and cabochon targets.
 * Uneven clipped planes describe removed rock, never a brilliant diamond cut. */
export function makeMineralGeometry() {
  const geometry = new THREE.SphereGeometry(1, 128, 88);
  const raw = geometry.attributes.position as THREE.BufferAttribute;
  const carved = raw.clone(), polished = raw.clone();
  for (let i = 0; i < raw.count; i++) {
    const x = raw.getX(i), y = raw.getY(i), z = raw.getZ(i);
    const n = (f: number) => noise(x * f + 5.2, y * f + 3.1, z * f + 7.8) - .5;
    const chips = Math.abs(n(13)) * .12 - Math.abs(n(32)) * .055;
    const relief = 1 + n(3) * .34 + n(7) * .17 + chips + n(80) * .025;
    const taper = 1 - y * .19;
    raw.setXYZ(i, x * relief * 1.04 * taper, y * relief * 1.25, z * relief * .73);
    // Asymmetric plane cuts leave an elongated, still rough mineral core.
    let cx = x * .87, cy = y * 1.40, cz = z * .65;
    const clipping = Math.max(1, (cx * .8 + cy * .36 + cz * .35) / .82,
      (-cx * .85 + cy * .24 + cz * .25) / .83, (-cx * .4 - cy * .58 + cz * .35) / .87,
      (cx * .65 + cz * .84) / .49, (-cx * .32 + cz * .95) / .55,
      (cx * .42 + cy * .62 + cz * .28) / .78);
    const grit = 1 + n(19) * .045 + n(55) * .025;
    cx = cx / clipping * grit; cy = cy / clipping * grit; cz = cz / clipping * grit;
    carved.setXYZ(i, cx, cy, cz);
    polished.setXYZ(i, x * .89 * (1 - y * .10), y * 1.28, z * .61);
  }
  geometry.computeVertexNormals();
  geometry.morphAttributes.position = [carved, polished];
  geometry.morphAttributes.normal = [carved, polished].map(position => {
    const target = new THREE.BufferGeometry(); target.setIndex(geometry.index);
    target.setAttribute("position", position); target.computeVertexNormals();
    const normals = target.attributes.normal.clone(); target.dispose(); return normals;
  });
  geometry.computeBoundingSphere();
  return geometry;
}

/** Closed jagged chips with varied aspect ratios and mineral-textured faces. */
export function makeFragment(seed: number) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const r = .7 + noise(x * 3 + seed, y * 3, z * 3) * .6;
    p.setXYZ(i, x * r * (.7 + seed * .07), y * r * 1.3, z * r * .63);
  }
  geometry.computeVertexNormals(); return geometry;
}

const textureCache = new Map<string, THREE.Texture>();
export function mineralTexture(name: string, color = false) {
  const key = `${name}-${color}`;
  if (!textureCache.has(key)) {
    const map = new THREE.TextureLoader().load(`/materials/${name}`, () => window.dispatchEvent(new Event("mineral-texture-ready")));
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 8;
    textureCache.set(key, map);
  }
  return textureCache.get(key)!;
}

export function makeMineralMaterial(raw: boolean) {
  const material = new THREE.MeshPhysicalMaterial({
    map: mineralTexture("firoza-albedo.png", true),
    bumpMap: mineralTexture("firoza-albedo.png"),
    bumpScale: raw ? .045 : .004,
    roughness: raw ? .72 : .27,
    metalness: 0, clearcoat: raw ? .025 : .38, clearcoatRoughness: .2,
    transmission: 0, envMapIntensity: .5,
  });
  const rawUniform = { value: raw ? 1 : 0 };
  material.userData.raw = rawUniform;
  material.onBeforeCompile = shader => {
    shader.uniforms.uRaw = rawUniform;
    shader.fragmentShader = "uniform float uRaw;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #include <map_fragment>
      float mineralBlue = smoothstep(.02, .20, diffuseColor.b - diffuseColor.r);
      diffuseColor.rgb *= mix(vec3(1.), vec3(.72, .88, 1.07), mineralBlue);
      // The same albedo persists through polishing; only the surface finish changes.
      diffuseColor.rgb *= mix(1., .85 + mineralBlue * .10, uRaw);
    `).replace("#include <roughnessmap_fragment>", `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(mix(.43, .25, mineralBlue), mix(.9, .61, mineralBlue), uRaw);
    `);
  };
  material.customProgramCacheKey = () => "hk-firoza-albedo-v4";
  return material;
}
