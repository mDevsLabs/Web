import { seeded } from '../math.ts';
export type Finish='metal'|'polymer'|'fabric'|'camo';
export function generateSurface(kind:Finish,size=256){
  const color=new Uint8Array(size*size*4),roughness=new Uint8Array(color.length),normal=new Uint8Array(color.length),heights=new Float32Array(size*size),random=seeded(kind.length*109+kind.charCodeAt(0));
  const fabric=kind==='fabric'||kind==='camo';
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ripstop=fabric&&((x%16===0)||(y%16===0))?.85:0;
    const weave=fabric?Math.sin(x*Math.PI*.5)*Math.cos(y*Math.PI*.5)*2.9+ripstop:0;
    const brush=kind==='metal'?Math.sin(y*Math.PI/3)*1.65+Math.sin(x*Math.PI/32+y*Math.PI/8)*.45:0;
    const stipple=kind==='polymer'?Math.sin(x*Math.PI*.75)*Math.sin(y*Math.PI*.75)*1.45:0;
    heights[y*size+x]=random()*2.2+weave+brush+stipple;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,h=heights[y*size+x];
    const patch=kind==='camo'?Math.sin(Math.floor(x/10)*1.17+Math.cos(Math.floor(y/12)*1.8))*Math.cos(Math.floor(y/8)*.53)+Math.sin(Math.floor((x+y)/14)*.9)*.22:0;
    const tint=kind==='camo'?patch>.34?.71:patch<-.38?.86:patch>.05?.94:1:1;
    const stitch=fabric&&((x+y)%64<2||((x-y+size)%64<2));
    const scratch=kind==='metal'&&((x*31+y*127)%997<2||(x*17-y*83+size*99)%1201<2);
    const value=Math.min(255,Math.round((fabric?234:246)*tint+h+(stitch?6:0)+(scratch?8:0)));
    color[i]=color[i+1]=value;color[i+2]=Math.max(0,value-(fabric?3:0));color[i+3]=255;
    const r=kind==='metal'?148+h*3.2+(scratch?-32:0):kind==='polymer'?218+h*2.4:238+h;
    roughness[i]=roughness[i+1]=roughness[i+2]=Math.min(255,Math.max(0,Math.round(r)));roughness[i+3]=255;
    const dx=(heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size])*.11,dy=(heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x])*.11,length=Math.hypot(dx,dy,1);
    normal[i]=Math.round((.5-dx/length*.5)*255);normal[i+1]=Math.round((.5-dy/length*.5)*255);normal[i+2]=Math.round((.5+.5/length)*255);normal[i+3]=255;
  }
  return {size,color,roughness,normal};
}
