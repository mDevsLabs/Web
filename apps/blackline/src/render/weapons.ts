import type { SkinId } from '../skin-catalog.ts';
import type { WeaponSpec } from '../types.ts';
import { createPistol } from './pistol.ts';
import { createRifle } from './rifles.ts';
import { createSpecialWeapon } from './special-weapons.ts';
export function createWeapon(w:WeaponSpec,firstPerson=false,skin:SkinId='factory'){return w.id==='pistol'?createPistol(w,firstPerson,skin):w.id==='shotgun'||w.id==='lmg'?createSpecialWeapon(w,firstPerson,skin):createRifle(w,firstPerson,skin);}
