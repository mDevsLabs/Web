import * as T from 'three';
import { seeded } from '../math.ts';
export type EnvironmentSurface='masonry'|'asphalt'|'bark'|'sand';
const cache=new Map<EnvironmentSurface,ReturnType<typeof generate>>();
function generate(kind:EnvironmentSurface){
  const size=512,color=new Uint8Array(size*size*4),rough=new Uint8Array(color.length),normal=new Uint8Array(color.length),height=new Float32Array(size*size),rand=seeded(kind.length*8309);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const mortar=kind==='masonry'&&(y%64<3||(x+Math.floor(y/64)%2*64)%128<3);
    const ridge=kind==='bark'?Math.sin(x*Math.PI/16+Math.sin(y*Math.PI/64)*.4)*.5+.5:0;
    const low=Math.sin(x*Math.PI/64)*Math.sin(y*Math.PI/64),n=rand();
    height[y*size+x]=mortar?.1:kind==='bark'?.3+ridge*.6+n*.1:kind==='asphalt'?.35+n*.22:kind==='sand'?.4+Math.sin((x+y)*Math.PI/32)*.025+n*.06:.65+low*.04+n*.07;
    const i=(y*size+x)*4,base=kind==='masonry'?mortar?174:226+low*6+(n-.5)*16:kind==='bark'?115+ridge*100+n*22:kind==='asphalt'?175+n*50:220+n*24;
    color[i]=Math.round(base);color[i+1]=Math.round(base*(kind==='bark'?.91:1));color[i+2]=Math.round(base*(kind==='bark'?.75:kind==='sand'?.96:1));color[i+3]=255;
    rough[i]=rough[i+1]=rough[i+2]=Math.round(kind==='asphalt'?190+n*55:230+n*25);rough[i+3]=255;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*2,dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*2,l=Math.hypot(dx,dy,1);
    normal[i]=Math.round((.5-dx/l*.5)*255);normal[i+1]=Math.round((.5-dy/l*.5)*255);normal[i+2]=Math.round((.5+.5/l)*255);normal[i+3]=255;
  }
  const texture=(data:Uint8Array,srgb=false)=>{const t=new T.DataTexture(data,size,size);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
  return {color:texture(color,true),normal:texture(normal),roughness:texture(rough)};
}
export function environmentMaps(kind:EnvironmentSurface){let maps=cache.get(kind);if(!maps){maps=generate(kind);cache.set(kind,maps);}return maps;}
