import type { Actor } from '../ai.ts';
import type { Supply } from '../mission.ts';
import type { MatchResult,Objective } from '../types.ts';
import type { World } from '../world.ts';
export type GameState='menu'|'playing'|'paused'|'dead'|'ending';
export interface HUDData {
  state:GameState;hp:number;ammo:number;reserve:number;weapon:string;weaponId:string;reload:number;grenades:number;
  stamina:number;score:[number,number];target:number;remaining:number;elapsed:number;mode:string;wave:number;nextWave:number;
  kills:number;deaths:number;streak:number;yaw:number;hit:number;headshot:boolean;damage:number;fps:number;resolution:string;
  objectives:Objective[];actors:Actor[];player:Actor;map:World['map'];aiming:boolean;scoreboard:boolean;
  ladderLabel?:string;thirdPerson?:boolean;autoFiring?:boolean;grenadeFuse?:number;grenadeDanger:boolean; traversalHint:string; elevation:number; scoped:boolean;opticSize?:number;opticX?:number;opticY?:number;weaponLevel?:number;
  supplies:Supply[];pointIndex:number;pointNext:number;pointRemaining:number;
}
export interface GameHooks {
  hud:(data:HUDData)=>void;state:(state:GameState)=>void;event:(type:string,data:Record<string,unknown>)=>void;
  end:(result:MatchResult)=>void;performance:(fps:number,resolution:string)=>void;
}
