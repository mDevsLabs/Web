import * as T from 'three';
import { aimDirection } from '../aim.ts';
import type { Game } from '../game.ts';
import { damp,rayBox } from '../math.ts';
import { nearBoxes } from '../spatial.ts';
import type { Box,Vec3 } from '../types.ts';
import { reticleEnemy,traceShot } from './targeting.ts';
export interface CameraRig {distance:number;collapsed:boolean;}
const vector=new T.Vector3();
export function wantsThirdPerson(game:Game){return game.settings?.cameraMode==='third'&&!game.aimDown&&game.player.alive&&!game.activeLadder&&!game.climbExit;}
// Sweep the full camera volume, including the ground, so steep angles cannot enter floors or walls.
export function cameraPosition(eye:Vec3,yaw:number,pitch:number,distance:number,props:Box[],shoulder:'left'|'right'='right'):Vec3 {
  const look=aimDirection(yaw,pitch),side=shoulder==='left'?-.55:.55;
  const delta=new T.Vector3(-look.x*distance+Math.cos(yaw)*side,-look.y*distance+.2,-look.z*distance-Math.sin(yaw)*side),len=delta.length(),dir=delta.clone().normalize();let hit=len;
  if(dir.y<0)hit=Math.min(hit,Math.max(0,(eye.y-.24)/-dir.y));
  // Search cells around the swept segment, including inflation, rather than every building panel.
  const center={x:eye.x+delta.x*.5,z:eye.z+delta.z*.5};
  for(const b of nearBoxes(props,center,len*.5+.4)){const d=rayBox(eye,dir,{...b,w:b.w+.36,d:b.d+.36,h:b.h+.36,y:(b.y??0)-.18},hit);if(d!==null)hit=Math.max(0,d-.05);}
  return {x:eye.x+dir.x*hit,y:eye.y+dir.y*hit,z:eye.z+dir.z*hit};
}
export function thirdPerson(this:Game){return wantsThirdPerson(this)&&this.cameraRig?.collapsed!==true;}
export function positionCamera(this:Game,dt=1/60){
  if(!wantsThirdPerson(this)){if(this.cameraRig)this.cameraRig.collapsed=false;return;}
  const eye=this.eye(this.player),candidate=cameraPosition(eye,this.player.yaw,this.player.pitch,this.settings.cameraDistance??3.5,this.world.map.props,this.settings.cameraShoulder??'right'),allowed=Math.hypot(candidate.x-eye.x,candidate.y-eye.y,candidate.z-eye.z);
  const rig=this.cameraRig??={distance:allowed,collapsed:false};rig.distance=allowed<rig.distance?allowed:damp(rig.distance,allowed,9,dt);rig.collapsed=rig.distance<.82;
  if(rig.collapsed){this.camera.position.set(eye.x,eye.y,eye.z);return;}
  const fraction=allowed>1e-5?rig.distance/allowed:0;this.camera.position.set(eye.x+(candidate.x-eye.x)*fraction,eye.y+(candidate.y-eye.y)*fraction,eye.z+(candidate.z-eye.z)*fraction);
  const focus=aimDirection(this.player.yaw,this.player.pitch);this.camera.lookAt(eye.x+focus.x*40,eye.y+focus.y*40,eye.z+focus.z*40);
}
export function cameraAimRay(game:Game){game.camera.updateMatrixWorld(true);game.camera.getWorldDirection(vector);return {origin:{x:game.camera.position.x,y:game.camera.position.y,z:game.camera.position.z},direction:{x:vector.x,y:vector.y,z:vector.z}};}
export function crosshairEnemy(this:Game,padding=0){const a=this.player;if(!this.thirdPerson())return reticleEnemy(a,this.actors??[],this.world.map.props,this.eye(a),padding);const {origin,direction}=cameraAimRay(this),hit=traceShot(origin,direction,a,this.actors,this.world.map.props,Math.min(150,a.weapon.range*2),padding);if(!hit.target||hit.target.team===a.team||hit.target.protectedTime>0)return null;const eye=this.eye(a),target=new T.Vector3(origin.x+direction.x*hit.nearest-eye.x,origin.y+direction.y*hit.nearest-eye.y,origin.z+direction.z*hit.nearest-eye.z),distance=target.length();target.normalize();const visibleHit=traceShot(eye,target,a,this.actors,this.world.map.props,distance+.5,padding);return visibleHit.target===hit.target?hit.target:null;}
