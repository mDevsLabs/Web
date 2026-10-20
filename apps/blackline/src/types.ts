import type { Career } from '../lib/game/career.js';
import type { Collection } from '../lib/game/shop-catalog.js';
import type { KeyBindings } from './keybindings.ts';
import type { ProgressBook } from './progression.ts';
export type Mode = 'tdm' | 'domination' | 'hardpoint' | 'survival';
export type MapId = 'harbor' | 'outpost' | 'forest' | 'foundry';
export type Difficulty = 'recruit' | 'regular' | 'veteran';
export type Quality = 'performance' | 'balanced' | 'ultra';
export type Team = 0 | 1;
export type Vec2 = { x: number; z: number };
export type Vec3 = Vec2 & { y: number };
export type Box = { x: number; z: number; w: number; d: number; h: number; y?: number; solid?:boolean };
export type Prop = Box & { kind: 'container' | 'wall' | 'crate' | 'barrier' | 'truck' | 'building' | 'tree'; color?: number; label?: string; enterable?:boolean; collisionOnly?:boolean };
export type Objective = Vec2 & { id: string; owner: Team | -1; progress: number; contested: boolean };
export interface MapData {
  id: MapId; name: string; subtitle: string; width: number; depth: number;
  props: Prop[]; spawns: [Vec2[], Vec2[]]; objectives: Vec2[];
}
export interface WeaponSpec {
  id: string; name: string; class: string; description: string;
  damage: number; headMultiplier: number; fireInterval: number; mag: number; reserve: number;
  reload: number; spread: number; recoil: number; range: number; automatic: boolean;
  color: number; mobility: number; zoom: number; pellets?:number;model?:string;
}
export interface Settings {
  renderResolution?:import('./graphics-policy.ts').RenderResolution;graphicsVersion?:2;cameraMode?:'first'|'third';cameraDistance?:number;cameraShoulder?:'right'|'left';batterySaver?:boolean;autoClimb?:boolean;autoReload?:boolean;adsSensitivity?:number;reticleScale?:number;joystickDeadzone?:number;motionLevel?:'full'|'reduced'|'off';hitFeedback?:'both'|'visual'|'audio'|'none';hitmarkerEnabled?:boolean;quality: Quality; adaptive: boolean; sensitivity: number; volume: number;
  fov: number; invertY: boolean; showFPS: boolean; crosshair: string; callsign: string;
  touchSensitivity:number;autoSprint:boolean;cameraShake:boolean;bindings?:KeyBindings;reticleStyle?:'dot'|'cross'|'circle';adsZoom?:number;touchScale?:number;leftHanded?:boolean;mobileAutoFire?:boolean;mobileAimAssist?:boolean;touchOpacity?:number;toggleAim?:boolean;hitmarkerSound?:boolean;screenEffects?:boolean;reduceMotion?:boolean;grenadePower?:number;
}
export interface MatchConfig { mode: Mode; map: MapId; difficulty: Difficulty; bots: number; allies?:number;enemies?:number; weapon: string; duration: number; }
export interface Profile {
  xp: number; kills: number; deaths: number; wins: number; matches: number;
  career?:Career;bestWave: number; bestStreak: number; weapon: string; weaponProgress?:ProgressBook;collection?:Collection;guideStep?:number;guideComplete?:boolean;
}
export interface MatchResult {stats?:import('./match-stats.ts').MatchStats;shots?:number;hits?:number;bestStreak?:number;map?:MapId;teamScore?:[number,number];roster?:{id:number;name:string;team:Team;player:boolean;kills:number;deaths:number;assists:number}[]; mode: Mode; victory: boolean; draw?: boolean; kills: number; deaths: number; assists: number; accuracy: number; score: number; wave: number; duration: number; xp: number; weaponXP?:Record<string,number>; }
export const WEAPONS: WeaponSpec[] = [
  { id:'ar', name:'M4 SENTINEL', class:'FUSIL D’ASSAUT', description:'Polyvalence et précision. Votre allié dans toutes les situations.', damage:26, headMultiplier:1.85, fireInterval:.105, mag:30, reserve:180, reload:2.1, spread:.008, recoil:.016, range:65, automatic:true, color:0x343d3d, mobility:1, zoom:58 },
  { id:'smg', name:'VX-9 PHANTOM', class:'PISTOLET-MITRAILLEUR', description:'Cadence élevée. Dominez les couloirs et les combats rapprochés.', damage:20, headMultiplier:1.65, fireInterval:.072, mag:40, reserve:240, reload:1.65, spread:.013, recoil:.011, range:35, automatic:true, color:0x262b2d, mobility:1.12, zoom:64 },
  { id:'dmr', name:'SR-25 REVENANT', class:'FUSIL DE PRÉCISION', description:'Tir semi-automatique. Chaque balle compte, chaque angle aussi.', damage:56, headMultiplier:2.1, fireInterval:.37, mag:12, reserve:84, reload:2.65, spread:.003, recoil:.038, range:100, automatic:false, color:0x4f5441, mobility:.9, zoom:28 },
  { id:'pistol', name:'P-12 WARDEN', class:'PISTOLET DE POING', description:'Compact, mobile et précis. Un pistolet semi-automatique pour les engagements rapides.', damage:30, headMultiplier:1.8, fireInterval:.19, mag:15, reserve:90, reload:1.35, spread:.007, recoil:.018, range:30, automatic:false, color:0x38414a, mobility:1.18, zoom:66 },
  { id:'shotgun',name:'SG-8 BREACHER',class:'FUSIL À POMPE',description:'Six plombs par cartouche. Puissant de près, exigeant à distance.',damage:17,headMultiplier:1.4,fireInterval:.82,mag:8,reserve:48,reload:2.8,spread:.014,recoil:.044,range:22,automatic:false,color:0x665648,mobility:.96,zoom:67,pellets:6 },
  { id:'lmg',name:'LM-60 BASTION',class:'MITRAILLEUSE LÉGÈRE',description:'Un chargeur de soutien de 60 cartouches. Contrôlez les angles au prix de votre mobilité.',damage:25,headMultiplier:1.7,fireInterval:.12,mag:60,reserve:240,reload:3.8,spread:.012,recoil:.025,range:65,automatic:true,color:0x465550,mobility:.79,zoom:60 },
  {id:'carbine',model:'ar',name:'CR-9 AURORA',class:'CARABINE',description:'Carabine légère à cadence maîtrisée. Précise en mouvement, chargeur court.',damage:29,headMultiplier:1.7,fireInterval:.145,mag:24,reserve:144,reload:1.85,spread:.006,recoil:.014,range:58,automatic:true,color:0x676452,mobility:1.06,zoom:61},
  {id:'marksman',model:'dmr',name:'S-96 HORIZON',class:'FUSIL LONGUE PORTÉE',description:'Fusil de précision à verrou. Cinq tirs puissants, une cadence exigeante.',damage:85,headMultiplier:1.8,fireInterval:1.15,mag:5,reserve:35,reload:3.1,spread:.0015,recoil:.05,range:130,automatic:false,color:0x626d58,mobility:.84,zoom:20},
];
export const MODES: Record<Mode,{name:string;short:string;description:string;target:number}> = {
  tdm:{name:'MATCH À MORT',short:'ÉLIMINATION',description:'Deux escouades. Une seule issue. Première équipe à 40 éliminations.',target:40},
  domination:{name:'DOMINATION',short:'CONTRÔLE',description:'Capturez A, B et C. Tenez le terrain. Première équipe à 200 points.',target:200},
  hardpoint:{name:'POINT STRATÉGIQUE',short:'ROTATION',description:'Un point actif change toutes les 40 secondes. Contrôlez-le pour atteindre 150 points.',target:150},
  survival:{name:'SURVIE',short:'DERNIER REMPART',description:'Affrontez des vagues de plus en plus intenses. Aucun renfort.',target:0},
};
export const DEFAULT_SETTINGS:Settings={graphicsVersion:2,cameraMode:'first',cameraShoulder:'right',cameraDistance:3.5,renderResolution:'auto',batterySaver:false,autoClimb:true,autoReload:true,adsSensitivity:1,reticleScale:1,joystickDeadzone:.09,motionLevel:'full',hitFeedback:'both',hitmarkerEnabled:true,quality:'ultra',adaptive:false,sensitivity:1,volume:.6,fov:84,invertY:false,showFPS:true,crosshair:'#d0e693',callsign:'MATHIAS',touchSensitivity:1,autoSprint:true,cameraShake:true,reticleStyle:'dot',adsZoom:1,touchScale:1,leftHanded:false,mobileAutoFire:true,mobileAimAssist:true,touchOpacity:.8,toggleAim:false,hitmarkerSound:true,screenEffects:true,reduceMotion:false,grenadePower:1};
export const DEFAULT_PROFILE:Profile={xp:0,kills:0,deaths:0,wins:0,matches:0,bestWave:0,bestStreak:0,weapon:'ar'};
export const rankFor=(xp:number)=>({level:Math.floor(xp/1200)+1,name:xp>=12000?'VÉTÉRAN':xp>=6000?'SERGENT':xp>=2400?'CAPORAL':'RECRUE',progress:(xp%1200)/1200});
export const weaponById=(id:string)=>WEAPONS.find(w=>w.id===id)??WEAPONS[0];
