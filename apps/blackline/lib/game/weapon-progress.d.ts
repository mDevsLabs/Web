export const WEAPON_IDS:string[];
export const MAX_WEAPON_LEVEL:number;
export function levelXP(level:number):number;
export function weaponLevel(xp:number):number;
export function normalizeWeaponProgress(value:unknown):Record<string,{xp:number;kills:number;headshots:number;progressVersion:2;power:number;skin:'factory'|'arctic'|'ember'|'night';equipped:('stabilizer'|'fast-mag'|'match-barrel')[]}>;
export function powerCost(rank:number):number;
