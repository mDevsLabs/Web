import { clamp } from './math.ts';
import type { Mode,Objective,Team } from './types.ts';
import { MODES } from './types.ts';
export function scoreElimination(scores:[number,number],mode:Mode,sourceTeam:Team,targetTeam:Team){if(mode==='tdm'&&sourceTeam!==targetTeam)scores[sourceTeam]++;}
export function captureObjective(o:Objective,counts:[number,number],dt:number){
  o.contested=counts[0]>0&&counts[1]>0;
  if(o.contested||(!counts[0]&&!counts[1]))return;
  const team:Team=counts[0]?0:1;
  o.progress=clamp(o.progress+(team===0?1:-1)*dt*.19*Math.min(2,Math.sqrt(counts[team])),-1,1);
  if(o.progress>=1)o.owner=0;else if(o.progress<=-1)o.owner=1;
  else if((o.owner===0&&o.progress<=0)||(o.owner===1&&o.progress>=0))o.owner=-1;
}
export function tickObjectives(scores:[number,number],objectives:Objective[]){for(const o of objectives)if(o.owner!==-1&&!o.contested)scores[o.owner]++;}
export function outcome(scores:[number,number],mode:Mode,time:number,duration:number):'win'|'loss'|'draw'|null {
  if(mode==='survival')return null;const target=MODES[mode].target;
  if(scores[0]>=target)return 'win';if(scores[1]>=target)return 'loss';
  if(time>=duration)return scores[0]===scores[1]?'draw':scores[0]>scores[1]?'win':'loss';return null;
}
