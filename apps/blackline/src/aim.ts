import { clamp } from './math.ts';

// Match the mouse's screen-space travel to the field of view, including ADS transitions.
export function aimSensitivity(fov:number,baseFov:number){
  return clamp(Math.tan(fov*Math.PI/360)/Math.tan(baseFov*Math.PI/360),.12,1);
}
export function shotSpread(base:number,aimAmount:number,speed:number,grounded:boolean,sniper=false){
  const aimed=1-aimAmount*(sniper?.99:.78);
  return base*aimed*(speed>4?1.7:1)*(grounded?1:2.2);
}
export function aimDirection(yaw:number,pitch:number){return {x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};}
