import type {Collection} from './shop-catalog.js';
export interface Career {version:1;coinsSpent:number;loadout:string[];appearance:{self:string;ally:string;enemy:string};rewards:{daily:string;weekly:string;week:string;matches:number;awarded:number;lastSeen:number};}
interface CareerProfile {xp:number;career?:Career;collection?:Collection;weaponProgress?:Record<string,{xp:number;power?:number}>;}
export const DEFAULT_LOADOUT:string[];
export const OUTFITS:string[];
export function normalizeLoadout(value:unknown,collection?:Collection):string[];
export function normalizeCareer(value:unknown,collection?:Collection,selected?:string):Career;
export function rewardKeys(now?:number):{day:string;week:string};
export function coins(profile:CareerProfile):number;
export function rewardStatus(profile:CareerProfile,now?:number):{day:string;week:string;clockOK:boolean;matches:number;daily:boolean;weekly:boolean};
export function recordWeeklyMatch(profile:CareerProfile,now?:number):void;
export function claimReward(profile:CareerProfile,kind:string,now?:number):boolean;
export function buyPower(profile:CareerProfile,id:string):boolean;

export function equipLoadoutWeapon(profile:CareerProfile&{weapon:string},id:string):boolean;
