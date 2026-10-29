import type { Prop } from './types.ts';
export const UPPER_FLOOR=3.28;
// These exact panels are used both for rendering and physical/raycast collisions.
export function interiorProps(b:Prop):Prop[]{
  const out:Prop[]=[],wall=(x:number,z:number,w:number,d:number,h:number,y=0)=>{if(w>.001&&d>.001&&h>.001)out.push({kind:'wall',x,z,w,d,h,y,color:b.color,collisionOnly:true});};
  const shell=(axis:'x'|'z',side:number)=>{const length=axis==='x'?b.w:b.d,holes:{l:number;r:number;bottom:number;top:number}[]=[];
    if(axis==='x')holes.push({l:-1.2,r:1.2,bottom:0,top:2.65});
    const centers=axis==='x'?[-b.w*.29,b.w*.29]:[-b.d*.28,b.d*.28];
    for(const center of centers)for(const floor of [0,UPPER_FLOOR])holes.push({l:center-.72,r:center+.72,bottom:floor+1,top:floor+2.48});
    const cuts=[-length/2,length/2,...holes.flatMap(h=>[h.l,h.r])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){const l=cuts[i],r=cuts[i+1],mid=(l+r)/2;const gaps=holes.filter(h=>mid>h.l&&mid<h.r).sort((a,b)=>a.bottom-b.bottom);let bottom=0;const segment=(y:number,h:number)=>axis==='x'?wall(b.x+mid,b.z+side*b.d/2,r-l,.22,h,y):wall(b.x+side*b.w/2,b.z+mid,.22,r-l,h,y);
      for(const gap of gaps){segment(bottom,gap.bottom-bottom);bottom=gap.top;}segment(bottom,b.h-bottom);
    }
  };
  for(const side of [-1,1]){shell('x',side);shell('z',side);}
  // First floor has an open stairwell on the right and a rear landing.
  wall(b.x-1.3,b.z,b.w-2.82,b.d-.24,.22,UPPER_FLOOR-.22);
  wall(b.x+b.w/2-1.41,b.z-b.d/2+.65,2.6,1.08,.22,UPPER_FLOOR-.22);
  const steps=24,run=b.d-2.8,depth=run/steps;
  for(let i=0;i<steps;i++)wall(b.x+b.w/2-1.4,b.z+b.d/2-1.4-depth*(i+.5),1.6,depth+.006,(i+1)*UPPER_FLOOR/steps);
  // Low cover inside the ground floor, away from doors and stairs.
  wall(b.x-b.w*.25,b.z,1.55,.75,.82);
  return out;
}
