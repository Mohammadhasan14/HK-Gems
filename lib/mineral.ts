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

/** Shared topology permits an actual rough-to-polished morph. The material
 * maps are baked from a 3D field to keep their seams continuous. */
export function makeMineralGeometry() {
  const geometry = new THREE.SphereGeometry(1, 160, 112);
  const raw = geometry.attributes.position as THREE.BufferAttribute;
  const polished = raw.clone();
  for (let i = 0; i < raw.count; i++) {
    const x = raw.getX(i), y = raw.getY(i), z = raw.getZ(i);
    const n = (f: number) => noise(x * f + 5.2, y * f + 3.1, z * f + 7.8) - 0.5;
    const relief = 1 + n(3) * 0.38 + n(8) * 0.17 + n(23) * 0.065 + n(64) * 0.016;
    const taper = 1 - y * 0.1;
    raw.setXYZ(i, x * relief * 0.92 * taper, y * relief * 1.08, z * relief * 0.76);
    polished.setXYZ(i, x * 0.82 * (1 - y * 0.065), y * 1.39, z * 0.62);
  }
  geometry.computeVertexNormals();
  const oval = geometry.clone();
  oval.setAttribute("position", polished);
  oval.computeVertexNormals();
  geometry.morphAttributes.position = [polished];
  geometry.morphAttributes.normal = [oval.attributes.normal.clone()];
  geometry.computeBoundingSphere();
  oval.dispose();
  return geometry;
}

/** Closed lens with planar facets, used as four independent cut meshes. */
export function makeCutPiece() {
  const points: THREE.Vector3[] = [];
  const rings = [[-0.29, 0.12], [-0.09, 0.73], [0.025, 1], [0.2, 0.49], [0.32, 0.05]];
  const positions: number[] = [];
  for (const [y, radius] of rings) for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.68));
  }
  for (let ring = 0; ring < rings.length - 1; ring++) for (let i = 0; i < 10; i++) {
    const a = ring * 10 + i, b = ring * 10 + (i + 1) % 10, c = a + 10, d = b + 10;
    for (const index of [a, c, b, b, c, d]) positions.push(...points[index].toArray());
  }
  // Close the small ends rather than leaving open silhouettes.
  for (const end of [0, 4]) for (let i = 1; i < 9; i++) {
    const indices = end === 0 ? [0, i, i + 1] : [40, 40 + i + 1, 40 + i];
    for (const index of indices) positions.push(...points[index].toArray());
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const uv: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    uv.push(positions[i] * .26 + .5, positions[i + 1] * .8 + .5);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const textureCache = new Map<string, THREE.Texture>();
function texture(name: string, color = false) {
  if (!textureCache.has(name)) {
    const map = new THREE.TextureLoader().load(`/materials/${name}.jpg`, () => window.dispatchEvent(new Event("mineral-texture-ready")));
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.anisotropy = 4;
    textureCache.set(name, map);
  }
  return textureCache.get(name)!;
}

export function makeMineralMaterial(raw: boolean, cut = false) {
  const material = new THREE.MeshPhysicalMaterial({
    map: texture("polished-color", true),
    roughnessMap: texture("polished-roughness"),
    bumpMap: texture(raw ? "raw-height" : "polished-height"),
    bumpScale: raw ? .035 : .003,
    roughness: 1,
    metalness: .025, clearcoat: raw ? .2 : .4, clearcoatRoughness: .14,
    transmission: 0,
    envMapIntensity: cut ? .8 : .38,
  });
  const rawUniform = { value: raw ? 1 : 0 };
  const rawMap = texture("raw-color", true);
  const rawRoughness = texture("raw-roughness");
  material.userData.raw = rawUniform;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRaw = rawUniform;
    shader.uniforms.uRawMap = { value: rawMap };
    shader.uniforms.uRawRoughness = { value: rawRoughness };
    shader.fragmentShader = "uniform float uRaw; uniform sampler2D uRawMap; uniform sampler2D uRawRoughness;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #include <map_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(uRawMap, vMapUv).rgb, uRaw);
    `).replace("#include <roughnessmap_fragment>", `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, texture2D(uRawRoughness, vRoughnessMapUv).g, uRaw);
    `);
  };
  material.customProgramCacheKey = () => "hk-mineral-texture-v2";
  return material;
}
