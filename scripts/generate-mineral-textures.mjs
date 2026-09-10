// Reproducible, offline PBR maps: node scripts/generate-mineral-textures.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const W=1536,H=768;
const fade=t=>t*t*(3-2*t);
const smooth=(a,b,v)=>fade(Math.max(0,Math.min(1,(v-a)/(b-a))));
function noise(x,y,z) {
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
 const fx=fade(x-ix),fy=fade(y-iy),fz=fade(z-iz);
 let result=0;
 for(let k=0;k<2;k++)for(let j=0;j<2;j++)for(let i=0;i<2;i++){
  const n=Math.sin((ix+i)*127.1+(iy+j)*311.7+(iz+k)*74.7)*43758.5453;
  result+=(n-Math.floor(n))*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);
 }
 return result;
}
const fbm=(x,y,z)=>noise(x,y,z)*.53+noise(x*2.07,y*2.07,z*2.07)*.27+noise(x*4.13,y*4.13,z*4.13)*.13+noise(x*8.31,y*8.31,z*8.31)*.07;
const maps=Object.fromEntries(['polished-color','raw-color','polished-roughness','raw-roughness','polished-height','raw-height'].map(n=>[n,Buffer.alloc(W*H*3)]));
for(let v=0;v<H;v++)for(let u=0;u<W;u++){
 const theta=v/H*Math.PI,phi=u/W*Math.PI*2;
 const x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta)*1.4,z=Math.sin(phi)*Math.sin(theta);
 const qx=x*5.8+fbm(x*2.4,y*2.4,z*2.4)*3.3,qy=y*5.8+fbm(x*2.4+14,y*2.4+14,z*2.4+14)*3.3,qz=z*5.8+fbm(x*2.4+31,y*2.4+31,z*2.4+31)*3.3;
 const field=fbm(qx,qy,qz), width=.005+.022*noise(x*8+18,y*8+18,z*8+18)**2;
 const primary=1-smooth(width,width+.012,Math.abs(field-.5));
 const branch=(1-smooth(.004,.014,Math.abs(fbm(qx*2.3+9,qy*2.3+9,qz*2.3+9)-.51)))*smooth(.43,.6,noise(x*3,y*3,z*3));
 const vein=Math.max(primary,branch*.8),rock=smooth(.40,.58,fbm(x*7+4,y*7+4,z*7+4));
 const detail=fbm(x*28,y*28,z*28),grain=noise(x*210,y*210,z*210);
 const mottle=smooth(.22,.76,fbm(x*4+17,y*4+17,z*4+17));
 const i=(v*W+u)*3;
 for(const raw of [false,true]){
  const mask=raw?Math.max(vein,rock*.97):vein;
  const name=raw?'raw':'polished';
  for(let c=0;c<3;c++){
   const turquoise=([3,72,92][c]+([12,175,193][c]-[3,72,92][c])*mottle)*(.84+detail*.3);
   const matrix=[27,20,11][c]+([169,127,64][c]-[27,20,11][c])*(detail*.8+grain*.2);
   maps[name+'-color'][i+c]=Math.max(0,Math.min(255,(turquoise*(1-mask)+matrix*mask)*(raw?.73+grain*.25:1)));
   maps[name+'-roughness'][i+c]=(raw?.35+mask*.5+detail*.12:.26+vein*.25+detail*.04)*255;
   maps[name+'-height'][i+c]=Math.max(0,Math.min(255,(.5+detail*.32-vein*.17+grain*(raw?.16:.01))*255));
  }
 }
}
await mkdir('public/materials',{recursive:true});
for(const [name,data] of Object.entries(maps))await sharp(data,{raw:{width:W,height:H,channels:3}}).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(`public/materials/${name}.jpg`);
console.log('Baked six 1536 × 768 mineral maps.');
