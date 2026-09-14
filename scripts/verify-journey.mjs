/* Capture each settled 3D state; a stitched page cannot measure a sticky canvas.
 * PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3102 BROWSER_HEADED=1 node scripts/verify-journey.mjs
 * CAPTURE_ONLY=1 skips interaction checks during visual iteration.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ids=['earth','discovery','shedding','refinement','masterpiece','meaning'];
const labels=['The Earth','Discovery','Shedding','Refinement','Masterpiece','Meaning'];
const output=path.resolve(process.env.OUTPUT_DIR || 'artifacts/refinement');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/opt/google/chrome/chrome',headless:process.env.BROWSER_HEADED!=='1',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=()=>page.evaluate(()=>({
 canvases:document.querySelectorAll('canvas').length,
 sections:[...document.querySelectorAll('.journey-section')].map(x=>x.id),
 rails:document.querySelectorAll('nav[aria-label="Story chapters"]').length,
 stops:document.querySelectorAll('.story-nav button').length,
 active:document.querySelector('.story-nav [aria-current]')?.getAttribute('aria-label'),
 pinSpacers:document.querySelectorAll('.pin-spacer').length,
 overflow:document.documentElement.scrollWidth>innerWidth,
 copy:[...document.querySelectorAll('.scene-copy-frame')].filter(x=>getComputedStyle(x).visibility==='visible').map(x=>({id:x.dataset.scene,opacity:Number(getComputedStyle(x).opacity)})),
 scrollY,viewport:`${innerWidth}x${innerHeight}`,
 fontSize:getComputedStyle(document.querySelector('.scene-support')).fontSize,
}));
const settle=async id=>{
 await page.evaluate(id=>scrollTo(0,document.getElementById(id).getBoundingClientRect().top+scrollY),id);
 await page.waitForFunction(id=>Number(getComputedStyle(document.querySelector(`[data-scene="${id}"]`)).opacity)>.99,id,{timeout:15000});
 await page.waitForTimeout(500);
};
const capture=name=>page.screenshot({path:path.join(output,name+'.png'),timeout:60000});
try{
 await page.goto(process.env.BASE_URL || 'http://localhost:3102',{waitUntil:'networkidle',timeout:120000});await page.waitForTimeout(2500);
 for(const id of ids){
  console.log('Desktop',id);await settle(id);await capture(id);const s=await state();results.push({id,...s});
  assert.equal(s.canvases,1);assert.equal(s.rails,1);assert.equal(s.stops,6);assert.equal(s.pinSpacers,0);
  assert.deepEqual(s.sections,ids);assert.deepEqual(s.copy,[{id,opacity:1}]);assert.equal(s.overflow,false);
  assert.ok(s.active.endsWith(labels[ids.indexOf(id)]));assert.ok(parseFloat(s.fontSize)>=16);
 }
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(650);await capture('footer');
 const footer=await page.evaluate(()=>({stageBottom:document.querySelector('.journey-stage').getBoundingClientRect().bottom,footerTop:document.querySelector('.site-footer').getBoundingClientRect().top,canvasBottom:document.querySelector('canvas').getBoundingClientRect().bottom}));
 assert.ok(Math.abs(footer.stageBottom-footer.footerTop)<2,'Stage must leave with the final scene');
 assert.ok(Math.abs(footer.canvasBottom-footer.footerTop)<2,'Canvas extends behind the footer');
 if(!process.env.CAPTURE_ONLY){
  console.log('Six navigation links and reverse scrolling');
  for(const id of [...ids].reverse()){await settle(id);assert.equal((await state()).copy[0].id,id)}
  for(let i=0;i<ids.length;i++){
   await page.getByRole('button',{name:`${String(i+1).padStart(2,'0')} ${labels[i]}`,exact:true}).click();
   await page.waitForFunction(id=>Math.abs(scrollY-(document.getElementById(id).getBoundingClientRect().top+scrollY))<2,ids[i]);
   await page.waitForTimeout(600);const s=await state();assert.deepEqual(s.copy,[{id:ids[i],opacity:1}]);assert.ok(s.active.endsWith(labels[i]));
  }
  for(const position of [.5,.65,.8,1.5,1.65,2.65,3.65,4.65]){
   await page.evaluate(p=>scrollTo(0,p*document.getElementById('earth').offsetHeight),position);await page.waitForTimeout(400);
   const s=await state();assert.ok(s.copy.length<=1,'Scene copy overlaps');
   if(position===1.5){assert.equal(s.copy[0]?.opacity,1,'Origin copy fades too early');await capture('origin-transition');}
  }
  console.log('Quick wheel gestures and reversals');
  await settle('earth');await page.mouse.wheel(0,3600);await page.waitForTimeout(1300);
  assert.ok((await state()).scrollY>3500);await page.mouse.wheel(0,-1800);await page.waitForTimeout(1300);
  assert.ok(Math.abs((await state()).scrollY-1800)<3);assert.ok((await state()).copy.length<=1);
  for(const viewport of [{width:1000,height:650},{width:390,height:844},{width:320,height:568},{width:360,height:640}]){
   console.log('Viewport',viewport);await settle('masterpiece');await page.setViewportSize(viewport);await page.waitForTimeout(600);
   assert.deepEqual((await state()).copy,[{id:'masterpiece',opacity:1}],'Resize lost the current scene');
   for(const id of ids){
    await settle(id);const s=await state();results.push({id,...s});assert.deepEqual(s.copy,[{id,opacity:1}]);assert.equal(s.overflow,false);
    if(viewport.width===390)await capture('mobile-'+id);
    if(viewport.width===320 && ['discovery','shedding','meaning'].includes(id))await capture('compact-'+id);
   }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const id of ids){await settle(id);assert.deepEqual((await state()).copy,[{id,opacity:1}])}
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(500);await capture('mobile-footer');
  await page.locator('.site-footer .wordmark').click();await page.waitForFunction(()=>scrollY<2);
 }
 const tiles=await Promise.all(ids.map(async(id,i)=>({input:await sharp(path.join(output,id+'.png')).resize(720,450).png().toBuffer(),left:(i%2)*720,top:Math.floor(i/2)*450})));
 await sharp({create:{width:1440,height:1350,channels:3,background:'#030302'}}).composite(tiles).png().toFile(path.join(output,'all-scenes.png'));
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({errors,footer,results},null,2));
 assert.deepEqual(errors,[]);console.log(`Verified ${results.length} scene/viewport states, clean footer, and no browser errors. Interaction checks: ${process.env.CAPTURE_ONLY?'skipped':'passed'}.`);
}catch(e){await capture('failure');console.error('Browser errors',errors);console.error('State',await state());throw e}
finally{await browser.close()}
