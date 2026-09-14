/* Real wheel-input verification and a forward/reverse animation recording.
 * PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3101 node scripts/verify-scroll-motion.mjs
 * Frame timing in software WebGL is diagnostic, not a hardware FPS benchmark.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output=path.resolve(process.env.OUTPUT_DIR || 'artifacts/refinement');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome',headless:process.env.BROWSER_HEADED !== '1',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1000,height:596},deviceScaleFactor:1,recordVideo:{dir:'/tmp/hk-scroll-video',size:{width:1000,height:596}}});
const page=await context.newPage(), video=page.video(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const sampleStart=()=>page.evaluate(()=>{
  window.__hkWheel={samples:[],running:true};
  const tick=time=>{
    window.__hkWheel.samples.push({time,y:scrollY,
      copy:[...document.querySelectorAll('.scene-copy-frame')].filter(x=>getComputedStyle(x).visibility==='visible').map(x=>x.dataset.scene)});
    if(window.__hkWheel.running)requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
});
const sampleEnd=()=>page.evaluate(()=>{window.__hkWheel.running=false;return window.__hkWheel.samples;});
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:3101',{waitUntil:'networkidle',timeout:120000});
  await page.waitForTimeout(2500);
  for(const direction of [1,-1]){
    console.log(direction===1?'Wheel forward':'Wheel backward');
    await sampleStart();
    for(let step=0;step<25;step++){
      await page.mouse.wheel(0,direction*(step%5===4?120:119));await page.waitForTimeout(300);
    }
    const destination=direction===1?2980:0;
    console.log("Reached",await page.evaluate(()=>scrollY),"target",destination);
    await page.waitForFunction(y=>Math.abs(scrollY-y)<2,destination,{timeout:20000});
    await page.waitForTimeout(1000);
    const samples=await sampleEnd();
    const positions=[...new Set(samples.map(x=>x.y))];
    assert.ok(positions.length>50,`Wheel scrolling jumped between positions: ${positions.length} unique samples`);
    assert.ok(samples.every((s,i)=>i===0||(s.y-samples[i-1].y)*direction>=-1),'Scroll direction reversed unexpectedly');
    assert.ok(samples.every(s=>s.copy.length<=1),'Outgoing and incoming copy overlap');
    const visited=[...new Set(samples.flatMap(s=>s.copy))];
    const expected=['earth','discovery','shedding','refinement','masterpiece','meaning'];
    assert.deepEqual(visited,direction===1?expected:expected.reverse());
    results.push({direction:direction===1?'forward':'backward',intermediatePositions:positions.length,visited,samples});
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(output,'scroll-motion.json'),JSON.stringify({errors,results},null,2));
  console.log('Continuous wheel positions, all six scene transitions, reverse order, and copy separation verified.');
} finally {
  await context.close();await video.saveAs(path.join(output,'scroll-animation.webm'));await browser.close();
}
