import { seeded } from '../math.ts';
export type Finish='metal'|'polymer'|'fabric'|'camo';
export function generateSurface(kind:Finish,size=256){
  const color=new Uint8Array(size*size*4),roughness=new Uint8Array(color.length),normal=new Uint8Array(color.length),heights=new Float32Array(size*size),random=seeded(kind.length*109+kind.charCodeAt(0));
  const fabric=kind==='fabric'||kind==='camo';
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const weave=fabric?Math.sin(x*Math.PI*.5)*Math.cos(y*Math.PI*.5)*2.8:0;
    const brush=kind==='metal'?Math.sin(y*Math.PI/4)*1.5:0;
    heights[y*size+x]=random()*2.2+weave+brush;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,h=heights[y*size+x];
    const patch=kind==='camo'?Math.sin(Math.floor(x/10)*1.17+Math.cos(Math.floor(y/12)*1.8))*Math.cos(Math.floor(y/8)*.53):0;
    const tint=kind==='camo'?patch>.32?.72:patch<-.4?.87:1:1;
    const stitch=fabric&&((x+y)%64<2||((x-y+size)%64<2));
    const scratch=kind==='metal'&&(x*31+y*127)%997<2;
    const value=Math.min(255,Math.round((fabric?234:246)*tint+h+(stitch?5:0)+(scratch?6:0)));
    color[i]=color[i+1]=value;color[i+2]=Math.max(0,value-(fabric?3:0));color[i+3]=255;
    const r=kind==='metal'?155+h*3+(scratch?-26:0):kind==='polymer'?222+h*2:238+h;
    roughness[i]=roughness[i+1]=roughness[i+2]=Math.min(255,Math.round(r));roughness[i+3]=255;
    const dx=(heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size])*.08,dy=(heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x])*.08,length=Math.hypot(dx,dy,1);
    normal[i]=Math.round((.5-dx/length*.5)*255);normal[i+1]=Math.round((.5-dy/length*.5)*255);normal[i+2]=Math.round((.5+.5/length)*255);normal[i+3]=255;
  }
  return {size,color,roughness,normal};
}
