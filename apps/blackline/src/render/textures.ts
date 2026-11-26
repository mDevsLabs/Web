import * as T from 'three';
import { seeded } from '../math.ts';

const cache=new Map<string,T.CanvasTexture>();
export function noiseTexture(kind:'concrete'|'metal'|'sand',seed:number):T.CanvasTexture {
  const key=kind+'-'+seed,cached=cache.get(key);if(cached)return cached.clone();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!,rand=seeded(seed),im=ctx.createImageData(512,512);
  const base=kind==='concrete'?[118,122,119]:kind==='metal'?[176,178,171]:[153,136,106];
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const i=(y*512+x)*4;
    const joint=kind==='concrete'&&(x%128<2||y%128<2)?-18:0;
    const ripple=kind==='sand'?Math.sin(x*.09+Math.sin(y*.04)*2.2)*7:0;
    const n=(rand()-.5)*32+Math.sin(x*.07)*Math.sin(y*.02)*5+joint+ripple;
    im.data[i]=Math.min(255,Math.max(0,base[0]+n));
    im.data[i+1]=Math.min(255,Math.max(0,base[1]+n));
    im.data[i+2]=Math.min(255,Math.max(0,base[2]+n));
    im.data[i+3]=255;
  }
  ctx.putImageData(im,0,0);
  if(kind==='concrete'){
    ctx.strokeStyle='#3a443e33';
    for(let i=0;i<64;i++){let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<8;j++){x+=(rand()-.5)*65;y+=rand()*38;ctx.lineTo(x,y);}ctx.lineWidth=rand()*1.8+.35;ctx.stroke();}
    for(let i=0;i<190;i++){ctx.fillStyle=`rgba(25,33,27,${rand()*.11})`;ctx.beginPath();ctx.ellipse(rand()*512,rand()*512,rand()*42+4,rand()*38+4,0,0,7);ctx.fill();}
  }else if(kind==='metal'){
    ctx.strokeStyle='#222b2b28';
    for(let x=0;x<512;x+=32){
      ctx.fillStyle='#ffffff20';ctx.fillRect(x,0,3,512);
      ctx.fillStyle='#00000018';ctx.fillRect(x+8,0,5,512);
      ctx.fillStyle='#ffffff14';for(let y=16;y<512;y+=64)ctx.fillRect(x+3,y,2,2);
    }
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;cache.set(key,texture);return texture.clone();
}
