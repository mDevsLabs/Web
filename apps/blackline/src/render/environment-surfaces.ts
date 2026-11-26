import * as T from 'three';
import { seeded } from '../math.ts';
export type EnvironmentSurface='masonry'|'asphalt'|'bark'|'sand';
const cache=new Map<EnvironmentSurface,ReturnType<typeof generate>>();
function generate(kind:EnvironmentSurface){
  const size=512,color=new Uint8Array(size*size*4),rough=new Uint8Array(color.length),normal=new Uint8Array(color.length),height=new Float32Array(size*size),rand=seeded(kind.length*8309);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const row=Math.floor(y/64),brickOffset=(row%2)*64,bx=(x+brickOffset)%128,by=y%64;
    const mortar=kind==='masonry'&&(by<3||bx<3);
    const bevel=kind==='masonry'&&!mortar?Math.min(1,Math.min(by-3,63-by,bx-3,127-bx)/6):1;
    const brickTint=kind==='masonry'?((row*37+Math.floor((x+brickOffset)/128)*73)%17-8):0;
    const ridge=kind==='bark'?Math.sin(x*Math.PI/16+Math.sin(y*Math.PI/64)*.45)*.5+.5+Math.sin(x*Math.PI/6+y*Math.PI/48)*.18:0;
    const low=Math.sin(x*Math.PI/64)*Math.sin(y*Math.PI/64),mid=Math.sin(x*Math.PI/16+1.3)*Math.cos(y*Math.PI/16-.7),n=rand();
    const microCrack=kind==='asphalt'?Math.max(0,1-Math.abs(Math.sin(x*Math.PI/48+Math.cos(y*Math.PI/32)*1.8))*14)*.16:0;
    const ripple=kind==='sand'?Math.sin((x+y*.65)*Math.PI/24)*.035+Math.sin((x*.4-y)*Math.PI/12)*.012:0;
    height[y*size+x]=mortar?.08:kind==='masonry'?(.52+bevel*.18+low*.03+mid*.018+n*.045):kind==='bark'?.26+ridge*.62+n*.09:kind==='asphalt'?.36-microCrack+mid*.035+n*.21:kind==='sand'?.42+ripple+n*.05:.65+low*.04+n*.07;
    const i=(y*size+x)*4;
    const base=kind==='masonry'?mortar?158+(n-.5)*12:222+brickTint+bevel*8+low*6+(n-.5)*16:kind==='bark'?108+ridge*98+n*20:kind==='asphalt'?166-microCrack*90+mid*8+n*52:218+ripple*110+n*24;
    color[i]=Math.min(255,Math.max(0,Math.round(base)));
    color[i+1]=Math.min(255,Math.max(0,Math.round(base*(kind==='bark'?.9:kind==='masonry'&&!mortar?.99:1))));
    color[i+2]=Math.min(255,Math.max(0,Math.round(base*(kind==='bark'?.74:kind==='sand'?.94:kind==='masonry'&&!mortar?.96:1))));
    color[i+3]=255;
    const rVal=kind==='asphalt'?182+microCrack*55+n*58:kind==='masonry'?(mortar?248:214-bevel*12+n*28):kind==='sand'?212+n*36:228+n*25;
    rough[i]=rough[i+1]=rough[i+2]=Math.min(255,Math.max(0,Math.round(rVal)));rough[i+3]=255;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*2.35,dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*2.35,l=Math.hypot(dx,dy,1);
    normal[i]=Math.round((.5-dx/l*.5)*255);normal[i+1]=Math.round((.5-dy/l*.5)*255);normal[i+2]=Math.round((.5+.5/l)*255);normal[i+3]=255;
  }
  const texture=(data:Uint8Array,srgb=false)=>{const t=new T.DataTexture(data,size,size);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
  return {color:texture(color,true),normal:texture(normal),roughness:texture(rough)};
}
export function environmentMaps(kind:EnvironmentSurface){let maps=cache.get(kind);if(!maps){maps=generate(kind);cache.set(kind,maps);}return maps;}
