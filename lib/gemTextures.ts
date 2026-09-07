import * as THREE from "three";

/**
 * The turquoise look, generated as textures rather than picked as a flat
 * material colour.
 *
 * A single `color` value cannot produce what a real turquoise reads as: the
 * body is mottled rather than uniform, and it is crossed by an irregular web
 * of host-rock matrix. That matrix is the identity of the stone — a plain
 * tinted material, however well lit, still reads as "a coloured 3D object".
 *
 * Three coupled maps are generated once at module load (never per frame):
 *
 *   colorMap      mottled blue-green body + brown/gold matrix web
 *   roughnessMap  matrix rougher than the polished body, so light behaves
 *                 differently on the veins instead of them being a decal
 *   bumpMap       matrix recessed slightly, the way host rock sits below a
 *                 polished turquoise face
 *
 * All three are derived from the SAME underlying vein field, which is what
 * makes the matrix read as embedded in the stone rather than painted on:
 * where there is a vein, the colour, the gloss and the surface height all
 * change together, exactly as they do on a real specimen.
 *
 * The web itself is a Voronoi boundary field — distance between the nearest
 * and second-nearest of a set of scattered seed points. That is genuinely
 * how turquoise matrix forms (host rock filling the gaps between nodules of
 * mineral), so it produces closed, irregular, organic cells rather than the
 * "gold wires laid over a blue ball" that stroked curves would give.
 */

const SIZE = 1024;

/** Deterministic pseudo-random in [0, 1) — stable across reloads. */
function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth value noise over a wrapping integer lattice. */
function makeNoise(period: number, seed: number) {
  const grid: number[] = [];
  for (let i = 0; i < period * period; i++) grid.push(hash(i + seed * 977));
  const at = (x: number, y: number) =>
    grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
  const fade = (t: number) => t * t * (3 - 2 * t);

  return (u: number, v: number) => {
    const x = u * period;
    const y = v * period;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = fade(x - xi);
    const ty = fade(y - yi);
    const top = at(xi, yi) * (1 - tx) + at(xi + 1, yi) * tx;
    const bottom = at(xi, yi + 1) * (1 - tx) + at(xi + 1, yi + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

/** Several octaves of value noise — natural mottling, not a smooth blur. */
function fbm(u: number, v: number, octaves: Array<(u: number, v: number) => number>) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (const octave of octaves) {
    sum += octave(u, v) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

/**
 * Seed points for the matrix web, scattered over a 3x3 tile block so cells
 * that straddle the texture's edge still close correctly and the seam does
 * not read as a straight line down the stone.
 */
const VEIN_SEEDS = (() => {
  const seeds: Array<[number, number]> = [];
  // Cell count sets the scale of the web. Tuned against the stone at hero
  // size: too few and the veins read as a handful of fat painted stripes,
  // too many and the matrix becomes a uniform texture that stops reading as
  // individual nodules of mineral separated by host rock.
  const count = 130;
  for (let i = 0; i < count; i++) {
    const u = hash(i * 3 + 0.11);
    const v = hash(i * 3 + 1.77);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) seeds.push([u + dx, v + dy]);
    }
  }
  return seeds;
})();

/**
 * Uniform grid over the seeds, so finding the two nearest to a pixel means
 * checking a handful of neighbouring buckets instead of all ~1200 seeds.
 * Without it this is a texture-resolution x seed-count product — around a
 * billion distance tests — which locks the main thread for seconds at load.
 * With it, the same image builds in a fraction of a second.
 */
const GRID_MIN = -1;
const GRID_SPAN = 3; // seeds are tiled across [-1, 2] on both axes
const GRID_DIM = 24;
const GRID_CELL = GRID_SPAN / GRID_DIM;

const VEIN_GRID: Array<Array<[number, number]>> = (() => {
  const buckets: Array<Array<[number, number]>> = Array.from(
    { length: GRID_DIM * GRID_DIM },
    () => [],
  );
  for (const seed of VEIN_SEEDS) {
    const gx = Math.floor((seed[0] - GRID_MIN) / GRID_CELL);
    const gy = Math.floor((seed[1] - GRID_MIN) / GRID_CELL);
    if (gx < 0 || gy < 0 || gx >= GRID_DIM || gy >= GRID_DIM) continue;
    buckets[gy * GRID_DIM + gx].push(seed);
  }
  return buckets;
})();

/**
 * Vein strength at (u, v): 1 on a cell boundary, falling to 0 inside a
 * cell. Warped by noise first, so the boundaries wander like mineral rather
 * than sitting as clean straight Voronoi edges.
 */
function veinField(
  u: number,
  v: number,
  warp: (u: number, v: number) => number,
  warp2: (u: number, v: number) => number,
  width: (u: number, v: number) => number,
): number {
  const wu = u + (warp(u, v) - 0.5) * 0.07;
  const wv = v + (warp2(u, v) - 0.5) * 0.07;

  let best = Infinity;
  let second = Infinity;
  const gx = Math.floor((wu - GRID_MIN) / GRID_CELL);
  const gy = Math.floor((wv - GRID_MIN) / GRID_CELL);
  // A 5x5 neighbourhood comfortably exceeds the largest gap between seeds at
  // this density, so the true two nearest are always inside it.
  for (let oy = -2; oy <= 2; oy++) {
    const cy = gy + oy;
    if (cy < 0 || cy >= GRID_DIM) continue;
    for (let ox = -2; ox <= 2; ox++) {
      const cx = gx + ox;
      if (cx < 0 || cx >= GRID_DIM) continue;
      for (const [su, sv] of VEIN_GRID[cy * GRID_DIM + cx]) {
        const dx = wu - su;
        const dy = wv - sv;
        const d = dx * dx + dy * dy;
        if (d < best) {
          second = best;
          best = d;
        } else if (d < second) {
          second = d;
        }
      }
    }
  }
  if (!isFinite(second)) return 0;
  // Gap between the two nearest seeds: ~0 exactly on a boundary.
  const edge = Math.sqrt(second) - Math.sqrt(best);
  // Band half-width, varied along the web so a seam thins to a hairline in
  // places and pools in others. A CONSTANT width is what made an earlier
  // pass read as gold wire laid over the stone: real host rock is a crack
  // filled unevenly, never a stroke of even weight.
  const halfWidth = 0.004 + width(u, v) * 0.011;
  return Math.max(0, 1 - edge / halfWidth);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface GemTextures {
  colorMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

/**
 * @param body        base turquoise, as [r, g, b] 0-255
 * @param bodyDeep    the darker blue-green the mottling sinks toward
 */
function build(body: [number, number, number], bodyDeep: [number, number, number]): GemTextures {
  const color = document.createElement("canvas");
  const rough = document.createElement("canvas");
  const bump = document.createElement("canvas");
  for (const c of [color, rough, bump]) {
    c.width = SIZE;
    c.height = SIZE;
  }
  const colorCtx = color.getContext("2d")!;
  const roughCtx = rough.getContext("2d")!;
  const bumpCtx = bump.getContext("2d")!;

  const colorData = colorCtx.createImageData(SIZE, SIZE);
  const roughData = roughCtx.createImageData(SIZE, SIZE);
  const bumpData = bumpCtx.createImageData(SIZE, SIZE);

  const mottleOctaves = [makeNoise(6, 1), makeNoise(13, 2), makeNoise(29, 3)];
  const grainOctaves = [makeNoise(47, 4), makeNoise(97, 5)];
  const warpA = makeNoise(7, 6);
  const warpB = makeNoise(7, 7);
  const veinWidth = makeNoise(11, 8);

  // Matrix tones: a dark host-rock brown, lifted toward a dull antique gold
  // on the thinner parts of the web. Deliberately desaturated — a saturated
  // gold reads as metal wire sitting on top of the stone.
  const matrixDark: [number, number, number] = [46, 33, 22];
  const matrixGold: [number, number, number] = [124, 96, 55];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const i = (y * SIZE + x) * 4;

      const mottle = fbm(u, v, mottleOctaves);
      const grain = fbm(u, v, grainOctaves);
      const vein = veinField(u, v, warpA, warpB, veinWidth);

      // Body: blue-green varying between the two supplied tones, with a
      // little fine grain so flat areas are never dead.
      const t = THREE.MathUtils.clamp(mottle * 1.25 - 0.12, 0, 1);
      let r = mix(bodyDeep[0], body[0], t) + (grain - 0.5) * 14;
      let g = mix(bodyDeep[1], body[1], t) + (grain - 0.5) * 14;
      let b = mix(bodyDeep[2], body[2], t) + (grain - 0.5) * 14;

      // Matrix over the top. Thin web edges pick up the gold tone; the
      // dense cores stay dark brown, as on a real stone.
      if (vein > 0) {
        const goldness = THREE.MathUtils.smoothstep(vein, 0.1, 0.5) * (0.25 + grain * 0.5);
        const mr = mix(matrixDark[0], matrixGold[0], goldness);
        const mg = mix(matrixDark[1], matrixGold[1], goldness);
        const mb = mix(matrixDark[2], matrixGold[2], goldness);
        const amount = Math.pow(vein, 0.75);
        r = mix(r, mr, amount);
        g = mix(g, mg, amount);
        b = mix(b, mb, amount);
      }

      colorData.data[i] = THREE.MathUtils.clamp(r, 0, 255);
      colorData.data[i + 1] = THREE.MathUtils.clamp(g, 0, 255);
      colorData.data[i + 2] = THREE.MathUtils.clamp(b, 0, 255);
      colorData.data[i + 3] = 255;

      // Roughness: the polished body is glossy and slightly variable; the
      // matrix is markedly rougher, because host rock does not take the
      // same polish as the mineral around it.
      const roughness = mix(0.16 + mottle * 0.12, 0.78, Math.pow(vein, 0.6));
      const rv = roughness * 255;
      roughData.data[i] = rv;
      roughData.data[i + 1] = rv;
      roughData.data[i + 2] = rv;
      roughData.data[i + 3] = 255;

      // Bump: matrix recessed below the polished face, plus faint body
      // undulation so the surface is never optically flat.
      const height = mix(0.5 + (mottle - 0.5) * 0.25, 0.06, Math.pow(vein, 0.7));
      const hv = height * 255;
      bumpData.data[i] = hv;
      bumpData.data[i + 1] = hv;
      bumpData.data[i + 2] = hv;
      bumpData.data[i + 3] = 255;
    }
  }

  colorCtx.putImageData(colorData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const colorMap = new THREE.CanvasTexture(color);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = new THREE.CanvasTexture(rough);
  const bumpMap = new THREE.CanvasTexture(bump);
  for (const t of [colorMap, roughnessMap, bumpMap]) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }

  return { colorMap, roughnessMap, bumpMap };
}

let cached: GemTextures | null = null;

/**
 * The hero stone's textures. Built lazily on first use (canvas needs a DOM)
 * and shared by every mesh that shows the stone, so the raw specimen, the
 * cut stages and the finished gem are visibly the same piece of turquoise
 * throughout the journey rather than three different-looking objects.
 */
export function getGemTextures(): GemTextures {
  if (!cached) cached = build([74, 158, 157], [18, 66, 78]);
  return cached;
}
