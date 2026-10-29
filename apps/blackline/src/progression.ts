import { normalizeWeaponProgress,weaponLevel } from '../lib/game/weapon-progress.js';
import type { SkinId } from './skin-catalog.ts';
import type { WeaponSpec } from './types.ts';
export { levelXP,weaponLevel } from '../lib/game/weapon-progress.js';
export type UpgradeId='stabilizer'|'fast-mag'|'match-barrel';
export interface WeaponProgress {xp:number;kills:number;headshots:number;progressVersion?:2;power?:number;equipped:UpgradeId[];skin?:SkinId;}
export type ProgressBook=Record<string,WeaponProgress>;
export const UPGRADES=[
  {id:'stabilizer' as const,name:'Poignée stabilisée',level:2,description:'Dispersion −15 % · recul −12 %'},
  {id:'fast-mag' as const,name:'Chargeur rapide',level:4,description:'Rechargement −12 %'},
  {id:'match-barrel' as const,name:'Canon de précision',level:7,description:'Portée +15 % · dispersion −10 %'},
];
const integer=(v:unknown)=>Math.min(10_000_000,Math.max(0,Math.floor(Number.isFinite(Number(v))?Number(v):0)));
export function normalizeProgress(value:unknown):ProgressBook {return normalizeWeaponProgress(value);}
export function awardWeaponXP(book:ProgressBook,id:string,xp:number,kill=false,head=false){
  const state=book[id]??={xp:0,kills:0,headshots:0,equipped:[],progressVersion:2,power:0},oldLevel=weaponLevel(state.xp);
  state.xp=integer(state.xp+Math.max(0,xp));if(kill)state.kills=integer(state.kills+1);if(kill&&head)state.headshots=integer(state.headshots+1);
  return {state,level:weaponLevel(state.xp),leveled:weaponLevel(state.xp)>oldLevel};
}
export function toggleUpgrade(book:ProgressBook,id:string,upgrade:UpgradeId){
  const state=book[id],spec=UPGRADES.find(u=>u.id===upgrade);if(!state||!spec||weaponLevel(state.xp)<spec.level)return false;
  state.equipped=state.equipped.includes(upgrade)?state.equipped.filter(u=>u!==upgrade):[...state.equipped,upgrade];return true;
}
export function upgradedWeapon(base:WeaponSpec,state?:WeaponProgress):WeaponSpec {
  if(!state)return base;const allowed=UPGRADES.filter(u=>u.level<=weaponLevel(state.xp)&&state.equipped.includes(u.id)).map(u=>u.id);
  return {...base,damage:base.damage*(1+Math.min(199,state.power??0)*.003),spread:base.spread*(allowed.includes('stabilizer')?.85:1)*(allowed.includes('match-barrel')?.9:1),recoil:base.recoil*(allowed.includes('stabilizer')?.88:1),reload:base.reload*(allowed.includes('fast-mag')?.88:1),range:base.range*(allowed.includes('match-barrel')?1.15:1)};
}
