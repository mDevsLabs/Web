import type { AIContext } from './ai.ts';
import { distance } from './math.ts';
import { hardpointAt } from './mission.ts';
import type { Vec2 } from './types.ts';

export type TacticalRole='assault'|'anchor'|'flanker';
export type SquadOrder={position:Vec2;kind:'advance'|'hold'|'flank'|'rotate';expires:number;};
export const roleFor=(id:number):TacticalRole=>id%3===0?'flanker':id%3===1?'assault':'anchor';

/** Decisions use public objectives and time-stamped observations, never hidden opponents. */
export function squadOrders(ctx:AIContext){
  const orders=new Map<number,SquadOrder>();
  for(const team of [0,1] as const){
    const allies=ctx.actors.filter(a=>a.alive&&!a.player&&a.team===team).sort((a,b)=>a.id-b.id);
    const reports=[...(ctx.intel?.[team].values()??[])].filter(r=>ctx.time-r.time<3).sort((a,b)=>b.time-a.time);
    const assigned=new Map<string,number>();
    for(const a of allies){
      const role=roleFor(a.id);let point:Vec2|null=null,kind:SquadOrder['kind']='advance';
      if(ctx.mode==='hardpoint'&&ctx.objectives.length){
        const rotation=hardpointAt(ctx.time,ctx.objectives.length),early=rotation.remaining<8&&role==='flanker';
        point=ctx.objectives[early?rotation.nextIndex:rotation.index];kind=early?'rotate':role==='anchor'?'hold':'advance';
      }else if(ctx.mode==='domination'&&ctx.objectives.length){
        point=[...ctx.objectives].sort((p,q)=>{
          const score=(o:typeof p)=>distance(a,o)*.5+(o.owner===team?(role==='anchor'?2:27):0)+(assigned.get(o.id)??0)*12-(o.contested?12:0);
          return score(p)-score(q);
        })[0];kind=role==='anchor'?'hold':'advance';
        const objective=point as typeof ctx.objectives[number];assigned.set(objective.id,(assigned.get(objective.id)??0)+1);
      }else if(reports.length){point=reports[0].position;kind=role==='flanker'?'flank':role==='anchor'?'hold':'advance';}
      if(!point){const buddy=ctx.actors.find(p=>p.player&&p.team===team&&p.alive);if(buddy&&ctx.mode!=='survival'&&distance(a,buddy)>13){point={x:buddy.x,z:buddy.z};kind=role==='anchor'?'hold':'advance';}else continue;}
      // A stable formation axis prevents a flanker from orbiting as it approaches its waypoint.
      const spawn=ctx.map.spawns[team][0],observed=ctx.mode!=='hardpoint'&&ctx.mode!=='domination',dx=point.x-spawn.x,dz=point.z-spawn.z,len=Math.max(1,Math.hypot(dx,dz)),side=a.id%2?1:-1;
      let destination={...point};
      if(role==='flanker'&&kind!=='rotate'){destination={x:point.x+dz/len*side*6,z:point.z-dx/len*side*6};kind='flank';}
      else if(role==='anchor'&&observed)destination={x:point.x-dx/len*11,z:point.z-dz/len*11};
      else if(role==='anchor'&&!observed)destination={x:point.x+(a.id%2?1:-1)*1.3,z:point.z+1.1};
      const cell=ctx.nav.nearest(destination);if(cell<0)continue;
      orders.set(a.id,{position:ctx.nav.point(cell),kind,expires:ctx.time+1.4});
    }
  }
  return orders;
}
