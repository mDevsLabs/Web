import type { WeaponSpec } from './types.ts';
export function aimFov(weapon:WeaponSpec,baseFov:number,zoomScale=1){
  if(weapon.id==='pistol')return 2*Math.atan(Math.tan(baseFov*Math.PI/360)/1.1)*180/Math.PI;
  return Math.min(baseFov,Math.max(20,weapon.zoom/zoomScale));
}
export function magnification(weapon:WeaponSpec,baseFov:number,zoomScale=1){return Math.tan(baseFov*Math.PI/360)/Math.tan(aimFov(weapon,baseFov,zoomScale)*Math.PI/360);}
