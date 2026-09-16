/* Verify the terrain stays anchored during forward/reverse scroll, including
 * intermediate phases, and that the mineral casts a live shadow on the ground.
 * Uses the same PLAYWRIGHT_MODULE, CHROME_PATH, BASE_URL and OUTPUT_DIR options
 * as verify-journey.mjs. Run against a development build for scene inspection.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.resolve(process.env.OUTPUT_DIR || '.tmp-verify/ground');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
  headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
// Observe the renderer through the devtools hook instead of adding test globals
// or extra frame work to the shipped application.
await page.addInitScript(() => {
  const roots = new Set();
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, renderers: new Map(),
    inject(renderer) { const id = this.renderers.size + 1; this.renderers.set(id, renderer); return id; },
    onCommitFiberRoot(_id, root) { roots.add(root); },
    onCommitFiberUnmount() {},
  };
  window.__groundRenderer = () => {
    for (const root of roots) {
      const state = root.containerInfo?.getState?.();
      if (state?.scene?.isScene) return state;
    }
    return null;
  };
});
const settle = async position => {
  await page.evaluate(p => scrollTo(0, p * document.getElementById('earth').offsetHeight), position);
  await page.waitForFunction(p => Math.abs(scrollY - p * document.getElementById('earth').offsetHeight) < 2, position);
  await page.waitForTimeout(180);
};
const state = () => page.evaluate(() => {
  const { scene, camera } = window.__groundRenderer();
  scene.updateMatrixWorld(true);
  const ground = scene.getObjectByName('rocky-environment');
  const objects = [ground, ...ground.children.filter(object => object.isMesh || object.isLight)];
  return {
    transforms: objects.map(object => ({ name: object.name || object.type, matrix: object.matrixWorld.toArray() })),
    camera: camera.matrixWorld.toArray(),
    mineral: scene.getObjectByName('natural-turquoise').matrixWorld.toArray(),
    phase: scene.getObjectByName('firoza-journey').userData.phase,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
});
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:3102', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__groundRenderer()?.scene.getObjectByName('rocky-environment'), null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await settle(0);
    const initial = await state();
    const positions = [0, .65, 1, 1.65, 2, 2.65, 3, 3.65, 4, 4.65, 5];
    for (const direction of [positions, [...positions].reverse()]) {
      for (const position of direction) {
        await settle(position);
        const current = await state();
        assert.deepEqual(current.transforms, initial.transforms, `Ground/light moved at ${viewport.width}px, scroll ${position}`);
        assert.deepEqual(current.camera, initial.camera, 'Camera motion makes the fixed terrain slide');
        assert.equal(current.overflow, false);
        if (position >= 1) assert.notDeepEqual(current.mineral, initial.mineral, 'The gemstone journey must still animate');
        results.push({ width: viewport.width, position, phase: current.phase });
      }
    }
    for (const position of [0, 2, 5]) {
      await settle(position);
      await page.screenshot({ path: path.join(output, `${viewport.width}-scene-${position}.png`) });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const position of [0, 2, 5, 0]) {
      await settle(position);
      assert.deepEqual((await state()).transforms, initial.transforms, 'Reduced motion moves the ground');
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await settle(0);
  const withShadow = await page.screenshot({ path: path.join(output, 'shadow-on.png') });
  await page.evaluate(() => {
    const renderer = window.__groundRenderer();
    renderer.scene.getObjectByName('firoza-journey').traverse(object => { if (object.isMesh) object.castShadow = false; });
    renderer.gl.shadowMap.needsUpdate = true;
    renderer.invalidate();
  });
  await page.waitForTimeout(300);
  const withoutShadow = await page.screenshot({ path: path.join(output, 'shadow-off.png') });
  const crop = { left: 650, top: 650, width: 650, height: 230 };
  const before = await sharp(withShadow).extract(crop).removeAlpha().raw().toBuffer();
  const after = await sharp(withoutShadow).extract(crop).removeAlpha().raw().toBuffer();
  let shadowPixels = 0;
  for (let i = 0; i < before.length; i += 3) {
    if (after[i] + after[i + 1] + after[i + 2] - before[i] - before[i + 1] - before[i + 2] > 3) shadowPixels++;
  }
  assert.ok(shadowPixels > 40, `No visible mineral shadow on terrain: ${shadowPixels} affected pixels`);
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ results, shadowPixels, errors }, null, 2));
  console.log(`Verified ${results.length} forward/reverse positions, fixed terrain/lights, mobile, reduced motion, and ${shadowPixels} live shadow pixels.`);
} finally {
  await browser.close();
}
