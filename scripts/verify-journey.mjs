/* Capture settled WebGL states separately; a full-page image cannot sample a fixed canvas.
 * PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3000 node scripts/verify-journey.mjs
 * Optional REFERENCE_IMAGE creates comparisons, normalized by width without stretching.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ids = ['earth','discovery','shedding','refinement','masterpiece','meaning'];
const output = path.resolve('artifacts/new-journey');
await fs.mkdir(output,{recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome',headless:process.env.BROWSER_HEADED !== "1",args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1000,height:596},deviceScaleFactor:1});
const errors=[], results=[];
page.on('pageerror',e=>{if(!errors.includes(e.message)) errors.push(e.message)});
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>({
  canvases:document.querySelectorAll('canvas').length,
  sections:[...document.querySelectorAll('.journey-section')].map(x=>x.id),
  rails:document.querySelectorAll('nav[aria-label="Story chapters"]').length,
  pinSpacers:document.querySelectorAll('.pin-spacer').length,
  overflow:document.documentElement.scrollWidth>innerWidth,
  copy:[...document.querySelectorAll('.scene-copy-frame')].filter(x=>getComputedStyle(x).visibility==='visible').map(x=>x.closest('section').id),
  scrollY, viewport:`${innerWidth}x${innerHeight}`,
}));
const settle=async(id)=>{
  await page.evaluate(id=>scrollTo(0,document.getElementById(id).offsetTop),id);
  await page.waitForFunction(id=>{
    const el=document.querySelector(`#${id} .scene-copy-frame`);
    return getComputedStyle(el).visibility==='visible' && Number(getComputedStyle(el).opacity)>.99;
  },id,{timeout:15000});
  await page.waitForTimeout(650);
};
const capture=name=>page.screenshot({path:path.join(output,name+'.png'),timeout:60000});
try {
 await page.goto(process.env.BASE_URL || 'http://localhost:3000',{waitUntil:'networkidle',timeout:120000});
 await page.waitForTimeout(3000);
 for(const id of ids){
   console.log("Desktop", id);
   await settle(id);await capture(id);
   const s=await state();results.push({id,...s});
   assert.equal(s.canvases,1);assert.equal(s.rails,1);assert.equal(s.pinSpacers,0);
   assert.deepEqual(s.sections,ids);assert.deepEqual(s.copy,[id]);assert.equal(s.overflow,false);
 }
 if(!process.env.CAPTURE_ONLY){
   console.log('Reverse scrolling');
   for(const id of [...ids].reverse()){await settle(id);assert.deepEqual((await state()).copy,[id]);}
   for(const position of [.65,.8,1.7,2.8,3.8,4.8]){
     await page.evaluate(p=>scrollTo(0,p*document.getElementById('earth').offsetHeight),position);
     await page.waitForTimeout(600);assert.ok((await state()).copy.length<=1,'Copy overlaps in transition');
   }
   console.log('Chapter links');
   for(const [label,id] of [['02 Discovery','discovery'],['03 Shedding','shedding'],['04 A Masterpiece','masterpiece']]){
     await settle('earth');await page.getByRole('button',{name:label,exact:true}).click();
     await page.waitForFunction(id=>Math.abs(scrollY-document.getElementById(id).offsetTop)<2,id,{timeout:15000});
     // Reaching the last pixel can precede Lenis' completion callback. Let the
     // navigation finish before issuing a native jump for the next assertion.
     await page.waitForTimeout(500);
     assert.deepEqual((await state()).copy,[id]);
   }
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(650);await capture('footer');
   await page.locator('.site-footer .wordmark').click();
   await page.waitForFunction(()=>scrollY<2,null,{timeout:15000});
   await page.waitForTimeout(500);
   assert.deepEqual((await state()).copy,['earth']);
   const brokenLinks=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).length);
   assert.equal(brokenLinks,0);
   for(const viewport of [{width:1440,height:900},{width:320,height:568},{width:390,height:844},{width:360,height:640}]){
     console.log('Viewport',viewport); await settle('masterpiece'); await page.setViewportSize(viewport);await page.waitForTimeout(500);
     assert.deepEqual((await state()).copy,['masterpiece'],'Resize should preserve the current chapter');
     for(const id of ids){
       await settle(id);const s=await state();results.push({id,...s});
       assert.deepEqual(s.copy,[id]);assert.equal(s.overflow,false);
       if(viewport.width===390)await capture('mobile-'+id);
       if(viewport.width===1440 && id==='earth')await capture('wide-earth');
       if(viewport.width===320 && id==='shedding')await capture('compact-shedding');
     }
   }
   await page.emulateMedia({reducedMotion:'reduce'});
   for(const id of ids){await settle(id);assert.deepEqual((await state()).copy,[id]);}
 }
 if(process.env.REFERENCE_IMAGE){
   const target=sharp(process.env.REFERENCE_IMAGE),{width}=await target.metadata();
   const panels=[[0,431],[431,360],[791,324],[1115,313],[1428,315],[1743,365]];
   const rows=[];
   for(let i=0;i<ids.length;i++){
     const [top,height]=panels[i];
     const crop=await target.clone().extract({left:0,top,width,height}).resize(1000,596,{fit:'contain',background:'#030302'}).png().toBuffer();
     const comparison=await sharp({create:{width:2000,height:596,channels:3,background:'#030302'}}).composite([
       {input:crop,left:0,top:0},{input:path.join(output,ids[i]+'.png'),left:1000,top:0}
     ]).png().toBuffer();
     await fs.writeFile(path.join(output,'comparison-'+ids[i]+'.png'),comparison);
     rows.push({input:comparison,left:0,top:i*596});
   }
   await sharp({create:{width:2000,height:3576,channels:3,background:'#030302'}}).composite(rows).png().toFile(path.join(output,'comparison-all.png'));
 }
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({errors,results},null,2));
 assert.deepEqual(errors,[]);
 console.log(`Verified ${results.length} scene/viewport states, one canvas, exact scene list, no overflow or browser errors.`);
} finally {await browser.close();}
