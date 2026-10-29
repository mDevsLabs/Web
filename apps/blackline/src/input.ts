import { clamp } from './math.ts';
import type { Quality } from './types.ts';

export type TouchAction='view'|'heal'|'fire'|'aim'|'jump'|'crouch'|'reload'|'grenade'|'melee'|'sprint'|'pause'|'score'|'interact'|'weapon-1'|'weapon-2'|'weapon-3'|'weapon-4'|'weapon-5'|'weapon-6';
type Point={x:number;y:number};
type Pointer={role:'move'|'look'|'fire'|'action';previous:Point;center:Point;radius:number};

export function touchDevice(coarse:boolean,maxTouchPoints:number,width:number){return coarse||(maxTouchPoints>0&&width<=1024);}
export function isTouchDevice(){return typeof window!=='undefined'&&touchDevice(window.matchMedia('(pointer: coarse)').matches,navigator.maxTouchPoints,innerWidth);}
export function renderBudget(quality:Quality,mobile:boolean){
  if(mobile)return quality==='ultra'?{pixels:1920*1080,ratio:1.75,shadows:1024,bloom:true}:quality==='balanced'?{pixels:1280*720,ratio:1.5,shadows:0,bloom:false}:{pixels:960*540,ratio:1,shadows:0,bloom:false};
  return quality==='ultra'?{pixels:3840*2160,ratio:4,shadows:4096,bloom:true}:quality==='balanced'?{pixels:2560*1440,ratio:1.5,shadows:2048,bloom:true}:{pixels:1920*1080,ratio:1,shadows:0,bloom:false};
}
export function joystick(dx:number,dy:number,radius=48,deadzone=.09){
  const length=Math.hypot(dx,dy),dead=clamp(deadzone,.04,.25);
  if(length<=radius*dead)return {side:0,forward:0};
  const amount=clamp((length/radius-dead)/(1-dead),0,1);
  return {side:dx/length*amount,forward:-dy/length*amount};
}
export function lookAngles(yaw:number,pitch:number,dx:number,dy:number,sensitivity:number,invertY:boolean,aimScale=1){
  const speed=.0055*sensitivity*aimScale;
  return {yaw:yaw-clamp(dx,-100,100)*speed,pitch:clamp(pitch-clamp(dy,-100,100)*speed*(invertY?-1:1),-1.48,1.48)};
}
export function movementVector(yaw:number,forward:number,side:number){
  const length=Math.max(1,Math.hypot(forward,side));
  return {x:(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length,z:(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length};
}
export class TouchInput {
  pointers=new Map<number,Pointer>();moveId:number|null=null;
  deadzone=.09;side=0;forward=0;aim=false;sprint=false;crouch=false;scoreboard=false;
  get firing(){return [...this.pointers.values()].some(p=>p.role==='fire');}
  begin(id:number,role:Pointer['role'],point:Point,center=point,radius=48){
    if(this.pointers.has(id)||(role==='move'&&this.moveId!==null))return false;
    this.pointers.set(id,{role,previous:{...point},center:{...center},radius});
    if(role==='move'){this.moveId=id;this.update(id,point);}return true;
  }
  update(id:number,point:Point):Point|null {
    const p=this.pointers.get(id);if(!p)return null;
    if(p.role==='move'){const v=joystick(point.x-p.center.x,point.y-p.center.y,p.radius,this.deadzone);this.side=v.side;this.forward=v.forward;}
    const delta=p.role==='look'||p.role==='fire'?{x:point.x-p.previous.x,y:point.y-p.previous.y}:null;
    p.previous={...point};return delta;
  }
  release(id:number){this.pointers.delete(id);if(id===this.moveId){this.moveId=null;this.side=0;this.forward=0;this.sprint=false;}}
  reset(){this.pointers.clear();this.moveId=null;this.side=0;this.forward=0;this.aim=false;this.sprint=false;this.crouch=false;this.scoreboard=false;}
}
