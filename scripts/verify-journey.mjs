/* Browser verification: PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-journey.mjs
 * BASE_URL, CHROME_PATH and REFERENCE_IMAGE can override the local defaults.
 * Each capture is one viewport: full-page screenshots cannot sample a scroll-driven canvas.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ids = ['arrival', 'origin', 'cut', 'tolerance'];
const output = path.resolve('artifacts/visual');

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
    headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 887, height: 500 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const results = [];
  const settle = async () => page.waitForTimeout(1000);
  const snapshot = async (name) => page.screenshot({ path: path.join(output, name + '.png'), timeout: 60000 });
  const state = async () => page.evaluate(() => ({
    active: document.querySelector('[aria-current="step"]')?.textContent,
    canvases: document.querySelectorAll('canvas').length,
    rails: document.querySelectorAll('nav[aria-label="Story chapters"]').length,
    pinSpacers: document.querySelectorAll('.pin-spacer').length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    copy: [...document.querySelectorAll('.scene-copy-frame')].filter(x => getComputedStyle(x).visibility === 'visible').map(x => x.closest('section').id),
  }));
  try {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000', { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForTimeout(2500);
    for (const id of ids) {
      await page.evaluate(id => scrollTo(0, document.getElementById(id).offsetTop), id);
      await settle(); await snapshot(id);
      const s = await state(); results.push({ viewport: '887x500', id, ...s });
      assert.equal(s.canvases, 1); assert.equal(s.rails, 1); assert.equal(s.pinSpacers, 0);
      assert.deepEqual(s.copy, [id]); assert.equal(s.overflow, false);
    }
    // Mid-transitions never show overlapping outgoing and incoming copy.
    for (const position of [.68, .78, .9, 1.78, 2.78, 3.78]) {
      await page.evaluate(position => scrollTo(0, position * document.getElementById('arrival').offsetHeight), position);
      await settle();
      const s = await state(); assert.ok(s.copy.length <= 1, `Overlapping copy at ${position}`);
      if (position === 1.78) await snapshot('transition');
    }
    // Navigation in reverse order must resolve to the same settled scene.
    for (const [id, label] of [['cut','2The Cut'], ['origin','1Descent'], ['arrival','0Hero']]) {
      await page.locator('.story-nav button').filter({ hasText: label.slice(1) }).click();
      await page.waitForFunction(label => document.querySelector('[aria-current="step"]')?.textContent === label, label, { timeout: 15000 });
      await settle();
      const s = await state(); assert.equal(s.active, label); assert.deepEqual(s.copy, [id]);
    }
    const sound = page.getByRole('button', { name: 'Sound', exact: true });
    await sound.click(); await page.waitForTimeout(200); assert.equal(await sound.getAttribute('aria-pressed'), 'true');
    await sound.click(); assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    // Retain and reach the original ring, worn and collection chapters.
    for (const id of ['object','worn','collection']) {
      await page.evaluate(id => scrollTo(0, document.getElementById(id).offsetTop), id);
      await settle(); const s = await state(); assert.equal(s.copy.length, 0); assert.equal(s.canvases, 1);
    }
    for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:360,height:640},{width:320,height:568}]) {
      await page.setViewportSize(viewport);
      for (const id of ids) {
        await page.evaluate(id => scrollTo(0, document.getElementById(id).offsetTop), id);
        await settle(); const s = await state();
        assert.deepEqual(s.copy, [id]); assert.equal(s.overflow, false);
        results.push({ viewport: `${viewport.width}x${viewport.height}`, id, ...s });
        if (viewport.width === 390) await snapshot('mobile-' + id);
        if (viewport.width === 1440 && id === 'arrival') await snapshot('desktop-wide');
        if (viewport.width === 360 && id === 'cut') await snapshot('mobile-short');
        if (viewport.width === 320 && id === 'cut') await snapshot('mobile-compact');
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => scrollTo(0,0)); await settle();
    assert.deepEqual((await state()).copy, ['arrival']);
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ errors, results }, null, 2));
    // Normalize by width, then letterbox shorter reference panels; never stretch them.
    if (process.env.REFERENCE_IMAGE) {
      const reference = sharp(process.env.REFERENCE_IMAGE);
      const metadata = await reference.metadata();
      const panels = [[0,500],[500,372],[872,400],[1272,metadata.height-1272]];
      const rows = [];
      for (let i=0;i<ids.length;i++) {
        const [top,height] = panels[i];
        const target = await reference.clone().extract({left:0,top,width:887,height}).resize(887,500,{fit:'contain',background:'#030403'}).png().toBuffer();
        const pair = await sharp({ create:{ width:1774,height:500,channels:3,background:'#030403' } }).composite([
          {input:target,left:0,top:0}, {input:path.join(output,ids[i]+'.png'),left:887,top:0},
        ]).png().toBuffer();
        await fs.writeFile(path.join(output,`comparison-${ids[i]}.png`),pair);
        rows.push({input:pair,left:0,top:i*500});
      }
      await sharp({create:{width:1774,height:2000,channels:3,background:'#030403'}}).composite(rows).png().toFile(path.join(output,'comparison-all.png'));
    }
    console.log('Verified four scenes, reverse navigation, transitions, sound, later content, resizing, and narrow screens.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
