import * as T from 'three';
import { seeded } from '../math.ts';

const cache=new Map<string,T.CanvasTexture>();
export function noiseTexture(kind:'concrete'|'metal'|'sand',seed:number):T.CanvasTexture {
  const key=kind+'-'+seed,cached=cache.get(key);if(cached)return cached.clone();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!,rand=seeded(seed),im=ctx.createImageData(512,512);
  const base=kind==='concrete'?[117,121,118]:kind==='metal'?[175,176,169]:[151,134,105];
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,n=(rand()-.5)*34+Math.sin(x*.07)*Math.sin(y*.02)*5;im.data[i]=base[0]+n;im.data[i+1]=base[1]+n;im.data[i+2]=base[2]+n;im.data[i+3]=255;}
  ctx.putImageData(im,0,0);
  if(kind==='concrete'){ctx.strokeStyle='#414b452b';for(let i=0;i<55;i++){let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<8;j++){x+=(rand()-.5)*70;y+=rand()*40;ctx.lineTo(x,y);}ctx.lineWidth=rand()*2+.4;ctx.stroke();}for(let i=0;i<180;i++){ctx.fillStyle=`rgba(27,35,28,${rand()*.1})`;ctx.beginPath();ctx.ellipse(rand()*512,rand()*512,rand()*45+5,rand()*40+4,0,0,7);ctx.fill();}}
  else if(kind==='metal'){ctx.strokeStyle='#222b2b25';for(let x=0;x<512;x+=40){ctx.fillStyle='#ffffff1c';ctx.fillRect(x,0,3,512);ctx.fillStyle='#00000015';ctx.fillRect(x+9,0,6,512);}}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;cache.set(key,texture);return texture.clone();
}
