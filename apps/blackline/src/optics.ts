import * as T from 'three';
import type { WeaponSpec } from './types.ts';
export function opticY(weapon:WeaponSpec){return (weapon.model??weapon.id)==='dmr'?.21:weapon.id==='pistol'?.16:.23;}
export function opticCenter(gun:T.Group,camera:T.PerspectiveCamera,weapon:WeaponSpec){
  gun.updateMatrixWorld(true);camera.updateMatrixWorld(true);return new T.Vector3(0,opticY(weapon),(weapon.model??weapon.id)==='dmr'?.075:-.019).applyMatrix4(gun.matrixWorld).project(camera);
}

export { aimFov,magnification } from './aim-optics.ts';
