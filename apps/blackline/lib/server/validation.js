import {normalizeCareer} from '../game/career.js';
import {normalizeWeaponProgress,WEAPON_IDS} from '../game/weapon-progress.js';
import { normalizeCollection,ownsWeapon,integer } from '../game/shop-catalog.js';
export const weaponIds=WEAPON_IDS;
const capped=(value)=>Number.isFinite(value)?Math.min(10000000,Math.max(0,Math.floor(value))):0;
export function normalizeSave(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid save');
  const profile=value.profile??{},result={profile:{},settings:{},callsign:'OPÉRATEUR'};
  for(const key of ['xp','kills','deaths','wins','matches','bestWave','bestStreak'])result.profile[key]=capped(profile[key]);
  result.profile.collection=normalizeCollection(profile.collection,result.profile.xp);result.profile.guideStep=Math.min(5,integer(profile.guideStep));result.profile.guideComplete=profile.guideComplete===true;result.profile.weapon=weaponIds.includes(profile.weapon)&&ownsWeapon(result.profile.collection,profile.weapon)?profile.weapon:'ar';result.profile.weaponProgress={};
  result.profile.weaponProgress=normalizeWeaponProgress(profile.weaponProgress);result.profile.career=normalizeCareer(profile.career,result.profile.collection,result.profile.weapon);
  if(!result.profile.career.loadout.includes(result.profile.weapon))result.profile.weapon=result.profile.career.loadout.find(id=>weaponIds.includes(id));
  const s=value.settings??{};result.callsign=typeof s.callsign==='string'?s.callsign.slice(0,18):'OPÉRATEUR';
  for(const k of ['quality','sensitivity','touchSensitivity','volume','fov','adaptive','showFPS','autoSprint','cameraShake','invertY','crosshair','adsZoom','reticleStyle','touchScale','leftHanded','bindings','mobileAutoFire','mobileAimAssist','touchOpacity','toggleAim','hitmarkerSound','screenEffects','reduceMotion','grenadePower','batterySaver','cameraMode','cameraDistance','cameraShoulder','graphicsVersion','renderResolution','autoClimb','autoReload','adsSensitivity','reticleScale','joystickDeadzone','motionLevel','hitFeedback','hitmarkerEnabled'])if(s[k]!==undefined)result.settings[k]=s[k];
  if(JSON.stringify(result.settings).length>8192)throw new Error('Settings too large');result.settings.callsign=result.callsign;return result;
}
