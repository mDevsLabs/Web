import type { Actor } from '../ai.ts';
import { aimDirection } from '../aim.ts';
import { rayBox,raySphere } from '../math.ts';
import { rayBoxes } from '../spatial.ts';
import type { Prop,Vec3 } from '../types.ts';
export function traceShot(origin:Vec3,dir:Vec3,source:Actor,actors:Actor[],props:Prop[],max=120,padding=0){
  let nearest=max,target:Actor|null=null,box:Prop|null=null,head=false,ground=false;
  if(dir.y<-.001){const hit=-origin.y/dir.y;if(hit>0&&hit<nearest){nearest=hit;ground=true;}}
  for(const prop of rayBoxes(props,origin,dir,max)){const hit=rayBox(origin,dir,prop,nearest);if(hit!==null&&hit<nearest){nearest=hit;box=prop;ground=false;}}
  for(const actor of actors){if(!actor.alive||actor===source)continue;const factor=actor.crouch?.72:1;
    for(const [y,r,isHead]of [[1.62,.215,true],[1.08,.37,false],[.52,.28,false]] as const){const hit=raySphere(origin,dir,{x:actor.x,y:actor.y+y*factor,z:actor.z},r+padding);if(hit!==null&&hit<nearest){nearest=hit;target=actor;head=isHead;box=null;ground=false;}}
  }
  return {nearest,target,box,head,ground};
}
export function reticleEnemy(player:Actor,actors:Actor[],props:Prop[],eye:Vec3,padding=0){const hit=traceShot(eye,aimDirection(player.yaw,player.pitch),player,actors,props,Math.min(120,player.weapon.range*2),padding);return hit.target&&hit.target.team!==player.team&&hit.target.protectedTime<=0?hit.target:null;}
export function spatialDistance(a:Vec3,b:Vec3){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
