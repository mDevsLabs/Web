import { circleBlocked,clamp } from './math.ts';
import { nearBoxes } from './spatial.ts';
import type { Box,Vec3 } from './types.ts';
export function moveCharacter(p:Vec3,dx:number,dz:number,r:number,boxes:Box[],width:number,depth:number,height=1.63,grounded=true){
  let {x,y,z}=p;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));
  const move=(nx:number,nz:number)=>{if(!circleBlocked({x:nx,z:nz},r,boxes,y,height)){x=nx;z=nz;return;}if(!grounded)return;
    const candidates=nearBoxes(boxes,{x:nx,z:nz},r).filter(b=>b.solid!==false).map(b=>(b.y??0)+b.h).filter(top=>top>y+.001&&top<=y+.24).sort((a,b)=>a-b);
    for(const top of candidates)if(!circleBlocked({x:nx,z:nz},r,boxes,top,height)){x=nx;z=nz;y=top;return;}
  };
  for(let i=0;i<steps;i++){move(clamp(x+dx/steps,-width/2+r,width/2-r),z);move(x,clamp(z+dz/steps,-depth/2+r,depth/2-r));}return {x,y,z};
}
