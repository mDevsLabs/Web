import { circleBlocked,clamp } from './math.ts';
import { nearBoxes } from './spatial.ts';
import type { Box,Prop,Vec2,Vec3 } from './types.ts';

export const JUMP_SPEED=7.3;
export const GRAVITY=17.5;
export const COYOTE_TIME=.1;
export interface Ladder extends Vec2 { roofY:number; exit:Vec2; building:Prop; }
export function buildingLadder(b:Prop):Ladder {
  return {x:b.x-b.w*.34,z:b.z+b.d/2+.62,roofY:b.h+.22,exit:{x:b.x-b.w*.34,z:b.z+b.d/2-.8},building:b};
}
export function nearbyLadder(p:Vec3,props:Prop[]):Ladder|null {
  for(const b of props){if(b.kind!=='building')continue;const l=buildingLadder(b);
    const roof=p.y>=l.roofY-.3;
    if(p.y>=-.05&&p.y<=l.roofY+.5&&Math.abs(p.x-l.x)<1.05&&p.z>=(roof?l.exit.z-.25:b.z+b.d/2+.25)&&p.z<=l.z+1.25)return l;
  }return null;
}
export function ladderStep(l:Ladder,y:number,input:number,dt:number){
  const next=clamp(y+input*3.6*dt,0,l.roofY);
  return {y:next,finished:input>0&&next>=l.roofY?'roof':input<0&&next<=0?'ground':null};
}
// Support and landings use the top of the actual collider, including elevated objects.
export function supportHeight(p:Vec2,feet:number,boxes:Box[]){
  let floor=0;
  for(const b of nearBoxes(boxes,p,.4)){if(b.solid===false)continue;const top=(b.y??0)+b.h;
    if(Math.hypot(p.x-clamp(p.x,b.x-b.w/2,b.x+b.w/2),p.z-clamp(p.z,b.z-b.d/2,b.z+b.d/2))<.35&&top<=feet+.025)floor=Math.max(floor,top);
  }return floor;
}
export function verticalStep(p:Vec3,velocity:number,grounded:boolean,dt:number,boxes:Box[],height=1.63){
  const floor=supportHeight(p,p.y,boxes);
  if(grounded&&Math.abs(p.y-floor)<.025&&velocity<=0)return {y:floor,velocity:0,grounded:true};
  velocity-=GRAVITY*dt;let y=p.y+velocity*dt;
  if(velocity>0){
    for(const b of nearBoxes(boxes,p,.4)){if(b.solid===false)continue;const bottom=b.y??0;
      if(bottom>p.y+height-.01&&bottom<=y+height&&Math.abs(p.x-b.x)<b.w/2+.3&&Math.abs(p.z-b.z)<b.d/2+.3){y=bottom-height;velocity=0;}
    }
  }else if(y<=floor){y=floor;velocity=0;grounded=true;return {y,velocity,grounded};}
  return {y,velocity,grounded:false};
}
export function ladderExitClear(l:Ladder,props:Prop[]){return !circleBlocked(l.exit,.36,props,l.roofY,1.63);}
export function roofProps(building:Prop):Prop[]{
  const b=building,roofY=b.h+.22,l=buildingLadder(b),wall=(x:number,z:number,w:number,d:number,h:number,y:number,color:number):Prop=>({kind:'wall',x,z,w,d,h,y,color});
  const props=[wall(b.x,b.z,b.w+.24,b.d+.24,.32,b.h-.1,0x505d5b)];
  // A real gap in the front parapet lets the ladder lead onto the roof.
  const left=b.x-b.w/2,right=b.x+b.w/2,gap=1.6;
  props.push(wall(b.x,b.z-b.d/2,b.w,.12,.42,roofY,0x69766d));
  for(const side of [-1,1])props.push(wall(b.x+side*b.w/2,b.z,.12,b.d,.42,roofY,0x69766d));
  props.push(wall((left+l.x-gap/2)/2,b.z+b.d/2,l.x-gap/2-left,.12,.42,roofY,0x69766d));
  props.push(wall((right+l.x+gap/2)/2,b.z+b.d/2,right-l.x-gap/2,.12,.42,roofY,0x69766d));
  props.push(wall(b.x+b.w*.2,b.z,1.75,1.5,.72,roofY,0x34403f));
  props.push(wall(b.x+b.w*.18,b.z+b.d*.28,2.5,.65,.88,roofY,0x66766b));
  return props;
}
