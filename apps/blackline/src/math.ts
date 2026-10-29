import { nearBoxes,rayBoxes } from './spatial.ts';
import type { Box,Vec2,Vec3 } from './types.ts';
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const damp=(a:number,b:number,speed:number,dt:number)=>lerp(a,b,1-Math.exp(-speed*dt));
export const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.z-b.z);
export const angleDiff=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function seeded(seed:number) { let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;}; }
export function circleBlocked(p:Vec2,r:number,boxes:Box[],feet=0,height=1.1):boolean {
  return nearBoxes(boxes,p,r).some(b=>b.solid!==false&&feet<b.h+(b.y??0)-.0001&&feet+height>(b.y??0)&&Math.hypot(p.x-clamp(p.x,b.x-b.w/2,b.x+b.w/2),p.z-clamp(p.z,b.z-b.d/2,b.z+b.d/2))<r);
}
export function moveCircle(p:Vec2,dx:number,dz:number,r:number,boxes:Box[],width:number,depth:number,feet=0):Vec2 {
  let x=p.x,z=p.z;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/Math.max(.1,r*.65)));
  for(let i=0;i<steps;i++){
    const nx=clamp(x+dx/steps,-width/2+r,width/2-r);
    if(!circleBlocked({x:nx,z},r,boxes,feet))x=nx;
    const nz=clamp(z+dz/steps,-depth/2+r,depth/2-r);
    if(!circleBlocked({x,z:nz},r,boxes,feet))z=nz;
  }
  return {x,z};
}
export function rayBox(origin:Vec3,dir:Vec3,box:Box,maxDistance=Infinity):number|null {
  if(box.solid===false)return null;
  let lo=0,hi=maxDistance;
  const min={x:box.x-box.w/2,y:box.y??0,z:box.z-box.d/2};
  const max={x:box.x+box.w/2,y:(box.y??0)+box.h,z:box.z+box.d/2};
  for(const axis of ['x','y','z'] as const){
    if(Math.abs(dir[axis])<1e-8){if(origin[axis]<min[axis]||origin[axis]>max[axis])return null;}
    else {let a=(min[axis]-origin[axis])/dir[axis],b=(max[axis]-origin[axis])/dir[axis];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;}
  }
  return lo;
}
export function raySphere(origin:Vec3,dir:Vec3,center:Vec3,r:number):number|null {
  const ox=origin.x-center.x,oy=origin.y-center.y,oz=origin.z-center.z;
  const b=ox*dir.x+oy*dir.y+oz*dir.z,c=ox*ox+oy*oy+oz*oz-r*r,d=b*b-c;
  if(d<0)return null;const near=-b-Math.sqrt(d);return near>=0?near:(-b+Math.sqrt(d)>=0?0:null);
}
export function visible(a:Vec3,b:Vec3,boxes:Box[]):boolean {
  const len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);if(len<.001)return true;
  const dir={x:(b.x-a.x)/len,y:(b.y-a.y)/len,z:(b.z-a.z)/len};
  return !rayBoxes(boxes,a,dir,len).some(box=>rayBox(a,dir,box,len-.15)!==null);
}
