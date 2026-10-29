// One progression curve for the game, migrations and API. Version 2 preserves legacy mastery levels.
export const WEAPON_IDS=['ar','smg','dmr','pistol','shotgun','lmg','carbine','marksman'];
export const MAX_WEAPON_LEVEL=200;
const int=v=>Number.isFinite(v)?Math.min(10000000,Math.max(0,Math.floor(v))):0;
export const levelXP=level=>Math.round(1200*Math.max(0,Math.min(200,level)-1)**1.65);
export function weaponLevel(xp){let lo=1,hi=200;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(levelXP(mid)<=int(xp))lo=mid;else hi=mid-1;}return lo;}
export function normalizeWeaponProgress(value){
  const input=value&&typeof value==='object'?value:{},out={};
  for(const id of WEAPON_IDS){const w=input[id]??{},old=int(w.xp),xp=w.progressVersion===2?old:Math.max(old,levelXP(Math.min(20,1+Math.floor(Math.sqrt(old/300))))),level=weaponLevel(xp);
    out[id]={progressVersion:2,xp,kills:int(w.kills),headshots:int(w.headshots),power:Math.min(level-1,int(w.power)),skin:[['factory',1],['arctic',1],['ember',4],['night',8]].find(([s,l])=>s===w.skin&&level>=l)?.[0]??'factory',equipped:[['stabilizer',2],['fast-mag',4],['match-barrel',7]].filter(([u,l])=>level>=l&&Array.isArray(w.equipped)&&w.equipped.includes(u)).map(([u])=>u)};
  }return out;
}
export const powerCost=rank=>2+Math.floor(Math.max(0,rank)/10);
