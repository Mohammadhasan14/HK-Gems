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

/** Shared topology permits an actual rough-to-polished morph. The field is
 * sampled in 3D, so the material has no UV seams or polar pinching. */
export function makeMineralGeometry() {
  const geometry = new THREE.SphereGeometry(1, 160, 112);
  const raw = geometry.attributes.position as THREE.BufferAttribute;
  const coords = raw.clone();
  const polished = raw.clone();
  for (let i = 0; i < raw.count; i++) {
    const x = raw.getX(i), y = raw.getY(i), z = raw.getZ(i);
    const n = (f: number) => noise(x * f + 5.2, y * f + 3.1, z * f + 7.8) - 0.5;
    const relief = 1 + n(3) * 0.36 + n(8) * 0.18 + n(23) * 0.105 + n(64) * 0.042;
    const taper = 1 - y * 0.1;
    raw.setXYZ(i, x * relief * 0.92 * taper, y * relief * 1.39, z * relief * 0.76);
    polished.setXYZ(i, x * 0.82 * (1 - y * 0.065), y * 1.39, z * 0.62);
    coords.setXYZ(i, x, y * 1.4, z);
  }
  geometry.setAttribute("mineralCoord", coords);
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
  geometry.setAttribute("mineralCoord", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export const mineralNoise = /* glsl */`
  varying vec3 vMineral;
  uniform float uRaw;
  float hash31(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float n3(vec3 p) {
    vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) { return n3(p)*.53 + n3(p*2.07)*.27 + n3(p*4.13)*.13 + n3(p*8.31)*.07; }
  vec3 mineralField(vec3 p) {
    vec3 warp=vec3(fbm(p*2.4),fbm(p*2.4+14.),fbm(p*2.4+31.));
    vec3 q=p*5.8+warp*3.3;
    float field=fbm(q);
    float width=.008+.027*pow(n3(p*8.+18.),2.);
    float primary=1.-smoothstep(width,width+.012,abs(field-.5));
    float branch=(1.-smoothstep(.007,.017,abs(fbm(q*2.3+9.)-.51)))*smoothstep(.43,.6,n3(p*3.));
    float vein=max(primary,branch*.75);
    float rock=smoothstep(.43,.57,fbm(p*7.+4.));
    return vec3(vein, rock, fbm(p*28.));
  }
`;

export function makeMineralMaterial(raw: boolean, cut = false) {
  const material = new THREE.MeshPhysicalMaterial({
    roughness: raw ? 0.86 : 0.26, metalness: 0.04,
    clearcoat: raw ? 0.05 : 0.48, clearcoatRoughness: 0.23,
    transmission: 0, envMapIntensity: cut ? 0.65 : 0.38,
  });
  const rawUniform = { value: raw ? 1 : 0 };
  material.userData.raw = rawUniform;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRaw = rawUniform;
    shader.vertexShader = `attribute vec3 mineralCoord; varying vec3 vMineral;\n${shader.vertexShader}`
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMineral = mineralCoord;");
    shader.fragmentShader = mineralNoise + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", /* glsl */`
      #include <map_fragment>
      vec3 mf = mineralField(vMineral);
      float grain=n3(vMineral*210.);
      float mottle=fbm(vMineral*4.+17.);
      vec3 turquoise=mix(vec3(.004,.115,.135),vec3(.014,.43,.47),smoothstep(.22,.76,mottle));
      turquoise *= .85 + mf.z*.3;
      vec3 matrix=mix(vec3(.045,.025,.01), vec3(.40,.28,.125),mf.z*.8+grain*.2);
      float matrixMask=mix(mf.x, max(mf.x,mf.y*.93),uRaw);
      diffuseColor.rgb=mix(turquoise,matrix,matrixMask);
      diffuseColor.rgb *= 1. - uRaw * (.15 + grain*.18);
    `).replace("#include <roughnessmap_fragment>", /* glsl */`
      #include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor + matrixMask*.17, .18, 1.);
    `).replace("#include <normal_fragment_maps>", /* glsl */`
      #include <normal_fragment_maps>
      float heightField = mf.z * mix(.0015,.026,uRaw) - mf.x*mix(.0007,.012,uRaw) + grain*.002*uRaw;
      vec3 q0=dFdx(-vViewPosition), q1=dFdy(-vViewPosition);
      vec3 s0=cross(q1,normal), s1=cross(normal,q0);
      float det=dot(q0,s0);
      normal=normalize(abs(det)*normal-sign(det)*(dFdx(heightField)*s0+dFdy(heightField)*s1));
    `);
  };
  material.customProgramCacheKey = () => "hk-mineral-v1";
  return material;
}
