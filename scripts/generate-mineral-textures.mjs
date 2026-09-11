// Deterministic spherical PBR maps shared by the rough and finished firoza.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const W=2048,H=1024;
const fade=t=>t*t*(3-2*t);
const smooth=(a,b,v)=>fade(Math.max(0,Math.min(1,(v-a)/(b-a))));
function noise(x,y,z) {
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=fade(x-ix),fy=fade(y-iy),fz=fade(z-iz);
 let result=0;
 for(let k=0;k<2;k++)for(let j=0;j<2;j++)for(let i=0;i<2;i++){
  const n=Math.sin((ix+i)*127.1+(iy+j)*311.7+(iz+k)*74.7)*43758.5453;
  result+=(n-Math.floor(n))*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);
 }
 return result;
}
const fbm=(x,y,z)=>noise(x,y,z)*.54+noise(x*2.07,y*2.07,z*2.07)*.27+noise(x*4.13,y*4.13,z*4.13)*.13+noise(x*8.31,y*8.31,z*8.31)*.06;
const maps=Object.fromEntries(['polished-color','raw-color','polished-roughness','raw-roughness','polished-height','raw-height'].map(n=>[n,Buffer.alloc(W*H*3)]));
for(let v=0;v<H;v++)for(let u=0;u<W;u++){
 const theta=v/H*Math.PI,phi=u/W*Math.PI*2;
 const x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta)*1.4,z=Math.sin(phi)*Math.sin(theta);
 const qx=x*6+fbm(x*3,y*3,z*3)*3.4,qy=y*6+fbm(x*3+14,y*3+14,z*3+14)*3.4,qz=z*6+fbm(x*3+31,y*3+31,z*3+31)*3.4;
 const field=fbm(qx,qy,qz),detail=fbm(x*45+4,y*45,z*45),grain=noise(x*380,y*380,z*380);
 const shards=noise(qx*3,qy*3,qz*3);
 const islands=smooth(.515,.565,field + (detail-.5)*.07);
 const thread=(1-smooth(.004,.014,Math.abs(fbm(qx*1.7+3,qy*1.7+3,qz*1.7+3)-.52)))*smooth(.39,.56,field);
 const matrix=Math.max(islands,thread*.8);
 const rawCrust=smooth(.52,.59,fbm(qx*.8+5,qy*.8+5,qz*.8+5)+(detail-.5)*.16);
 const mottle=smooth(.25,.77,fbm(x*4+17,y*4+17,z*4+17));
 const quartz=smooth(.43,.58,fbm(qx*1.2+40,qy*1.2+40,qz*1.2+40));
 const edge=smooth(.42,.62,shards*.5+detail*.5);
 const i=(v*W+u)*3;
 for(const raw of [false,true]){
  const mask=raw?Math.max(matrix,rawCrust*.92):matrix;
  const name=raw?'raw':'polished';
  for(let c=0;c<3;c++){
   const turquoise=([2,95,125][c]+([5,176,202][c]-[2,95,125][c])*mottle)*(.82+detail*.33);
   const ochre=[28,24,16][c]+([171,137,80][c]-[28,24,16][c])*edge;
   const slate=[30,33,32][c]+([198,194,177][c]-[30,33,32][c])*(detail*.6+grain*.4);
   const rock=ochre*(1-quartz)+slate*quartz;
   maps[name+'-color'][i+c]=Math.max(0,Math.min(255,(turquoise*(1-mask)+rock*mask)*(raw?.78+grain*.32:1)));
   maps[name+'-roughness'][i+c]=(raw?.54+mask*.3+detail*.10:.21+mask*.16+detail*.04)*255;
   maps[name+'-height'][i+c]=Math.max(0,Math.min(255,(.32+detail*.24+mask*.22+grain*(raw?.19:.008))*255));
  }
 }
}
await mkdir('public/materials',{recursive:true});
for(const [name,data] of Object.entries(maps))await sharp(data,{raw:{width:W,height:H,channels:3}}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(`public/materials/${name}.jpg`);
console.log('Baked six 2048 × 1024 turquoise maps with irregular brown and pale host-rock matrix.');
