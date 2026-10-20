import { normalizeCareer,recordWeeklyMatch } from '../lib/game/career.js';
import { integer,normalizeCollection,ownsWeapon } from '../lib/game/shop-catalog.js';
import { normalizeProgress } from './progression.ts';
import { clearVault,readVault,writeVault } from './save-vault.ts';
import { normalizeSettings } from './settings-normalize.ts';
import type { MatchResult,Profile,Settings } from './types.ts';
import { DEFAULT_PROFILE,WEAPONS } from './types.ts';
export { normalizeSettings } from './settings-normalize.ts';
function read(key:string){try{return readVault(localStorage,key);}catch{return null;}}
function save(key:string,data:unknown){try{const ok=writeVault(localStorage,key,data);if(!ok&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('blackline:storage-error'));return ok;}catch{return false;}}
export const loadSettings=(mobile=false):Settings=>normalizeSettings(read('blackline-settings-v1'),mobile);
export function normalizeProfile(value:unknown):Profile {const v=(value&&typeof value==='object'?value:{}) as Record<string,any>,r={...DEFAULT_PROFILE};for(const k of ['xp','kills','deaths','wins','matches','bestWave','bestStreak'] as const)r[k]=Math.min(10_000_000,Math.max(0,Math.floor(Number.isFinite(v[k])?v[k]:0)));r.weaponProgress=normalizeProgress(v.weaponProgress);r.collection=normalizeCollection(v.collection,r.xp);r.guideStep=Math.min(5,integer(v.guideStep));r.guideComplete=v.guideComplete===true;r.weapon=WEAPONS.some(w=>w.id===v.weapon)&&ownsWeapon(r.collection,v.weapon)?v.weapon:'ar';r.career=normalizeCareer(v.career,r.collection,r.weapon);if(!r.career.loadout.includes(r.weapon))r.weapon=r.career.loadout.find(id=>WEAPONS.some(w=>w.id===id))!;return r;}
export const loadProfile=():Profile=>normalizeProfile(read('blackline-profile-v1'));
export const saveSettings=(s:Settings)=>save('blackline-settings-v1',s);
export const saveProfile=(p:Profile)=>save('blackline-profile-v1',p);
export function recordMatch(profile:Profile,result:MatchResult){profile.xp+=result.xp;profile.kills+=result.kills;profile.deaths+=result.deaths;profile.matches++;if(result.victory)profile.wins++;profile.bestWave=Math.max(profile.bestWave,result.wave);for(const key of ['xp','kills','deaths','wins','matches','bestWave','bestStreak'] as const)profile[key]=integer(profile[key]);recordWeeklyMatch(profile);saveProfile(profile);}

let pending:Profile|null=null,timer:ReturnType<typeof setTimeout>|undefined;
export function queueProfileSave(profile:Profile){pending=profile;if(timer!==undefined)return;timer=setTimeout(flushProfileSave,1500);}
export function flushProfileSave(){if(timer!==undefined)clearTimeout(timer);timer=undefined;if(pending){saveProfile(pending);pending=null;}}
export function resetProfileSave(profile:Profile){flushProfileSave();try{clearVault(localStorage,'blackline-profile-v1');}catch{}return saveProfile(profile);}
export function exportSave(profile:Profile,settings:Settings){return JSON.stringify({game:'BLACKLINE',version:'1.2.0',exportedAt:new Date().toISOString(),profile:normalizeProfile(profile),settings:normalizeSettings(settings)},null,2);}
export function importSave(text:string,mobile=false){if(text.length>1_000_000)throw new Error('Fichier trop volumineux.');const value=JSON.parse(text);if(value?.game!=='BLACKLINE'||!value.profile||typeof value.profile!=='object'||Array.isArray(value.profile)||(value.settings!==undefined&&(!value.settings||typeof value.settings!=='object'||Array.isArray(value.settings))))throw new Error('Sauvegarde BLACKLINE invalide.');return {profile:normalizeProfile(value.profile),settings:normalizeSettings(value.settings,mobile)};}
if(typeof window!=='undefined'){window.addEventListener('pagehide',flushProfileSave);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushProfileSave();});}
