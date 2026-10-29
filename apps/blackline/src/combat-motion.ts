import { clamp,lerp } from './math.ts';
import type { Box,Vec3 } from './types.ts';

const smooth=(a:number,b:number,t:number)=>{const u=clamp((t-a)/(b-a),0,1);return u*u*(3-2*u);};
export function reloadPose(progress:number){
  const t=clamp(progress,0,1),tilt=smooth(0,.18,t)*(1-smooth(.88,1,t));
  const pull=smooth(.2,.42,t)*(1-smooth(.59,.8,t)),reach=smooth(.08,.2,t)*(1-smooth(.8,1,t));
  const bolt=smooth(.82,.88,t)*(1-smooth(.9,.97,t));
  return {
    pitch:.32*tilt,roll:-.32*tilt,drop:.065*tilt,
    magazineY:-.6*pull,magazineZ:.16*pull,magazineAngle:.24*pull,
    magazineVisible:t<.43||t>.57,handX:.03*reach,handY:-.08*reach-.48*pull,handZ:.12*reach+.12*pull,
    boltZ:.065*bolt,phase:t<.2?'PRISE DU CHARGEUR':t<.43?'EXTRACTION':t<.8?'INSERTION':t<.97?'VERROUILLAGE':'PRÊT',
  };
}
export const reloadProgress=(remaining:number,duration:number)=>remaining>0?clamp(1-remaining/Math.max(.01,duration),0,1):1;
export function surfaceNormal(point:Vec3,box:Box):Vec3 {
  const faces:[number,Vec3][]=[
    [Math.abs(point.x-(box.x-box.w/2)),{x:-1,y:0,z:0}],[Math.abs(point.x-(box.x+box.w/2)),{x:1,y:0,z:0}],
    [Math.abs(point.z-(box.z-box.d/2)),{x:0,y:0,z:-1}],[Math.abs(point.z-(box.z+box.d/2)),{x:0,y:0,z:1}],
    [Math.abs(point.y-(box.y??0)),{x:0,y:-1,z:0}],[Math.abs(point.y-((box.y??0)+box.h)),{x:0,y:1,z:0}],
  ];return faces.sort((a,b)=>a[0]-b[0])[0][1];
}
export function tracerSegment(from:Vec3,to:Vec3,age:number,duration=.075){
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z,length=Math.hypot(dx,dy,dz);
  const head=clamp(age/duration,0,1),tail=Math.max(0,head-Math.min(7,length)/Math.max(.001,length));
  return {start:{x:lerp(from.x,to.x,tail),y:lerp(from.y,to.y,tail),z:lerp(from.z,to.z,tail)},end:{x:lerp(from.x,to.x,head),y:lerp(from.y,to.y,head),z:lerp(from.z,to.z,head)}};
}
