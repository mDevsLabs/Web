import type { Actor } from './ai.ts';
import { distance } from './math.ts';
import type { Navigation } from './navigation.ts';
import type { MapData,Vec2 } from './types.ts';

export const POINT_DURATION=40;
const ROTATION=[1,2,0,2,1,0];
export function hardpointAt(time:number,count=3){
  const phase=Math.floor(Math.max(0,time)/POINT_DURATION),sequence=count===3?ROTATION:Array.from({length:Math.max(1,count)},(_,i)=>i);
  return {index:sequence[phase%sequence.length],nextIndex:sequence[(phase+1)%sequence.length],remaining:POINT_DURATION-Math.max(0,time)%POINT_DURATION};
}
export function pointControl(point:Vec2,actors:Actor[]){
  const counts:[number,number]=[0,0];
  for(const a of actors)if(a.alive&&a.y<1.5&&distance(a,point)<3.6)counts[a.team]++;
  return {owner:counts[0]>0&&counts[1]===0?0:counts[1]>0&&counts[0]===0?1:-1,contested:counts[0]>0&&counts[1]>0,counts};
}
export interface Supply extends Vec2 {id:number;kind:'ammo'|'medical';readyAt:number;}
export function createSupplies(map:MapData,nav:Navigation):Supply[]{
  return [{x:-25,z:25},{x:25,z:-25},{x:-17,z:27},{x:17,z:-27},{x:-20,z:-20},{x:20,z:20}].map((p,id)=>{
    const cell=nav.nearest(p),position=cell>=0?nav.point(cell):map.spawns[id%2][0];
    return {...position,id,kind:id%3===2?'medical':'ammo',readyAt:0};
  });
}
export function collectSupply(a:Actor,s:Supply,time:number){
  if(!a.alive||a.y>.8||s.readyAt>time||distance(a,s)>1.45)return false;
  if(s.kind==='medical'){
    if(a.hp>=95)return false;
    a.hp=Math.min(100,a.hp+45);
  }else{
    if(a.reserve>=a.weapon.reserve)return false;
    a.reserve=Math.min(a.weapon.reserve,a.reserve+a.weapon.mag*3);
  }
  s.readyAt=time+(s.kind==='medical'?20:25);return true;
}
