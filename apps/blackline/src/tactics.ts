import type { Actor,Noise } from './ai.ts';
import { circleBlocked,clamp,distance,visible } from './math.ts';
import type { MapData,Vec2,Vec3 } from './types.ts';

export function friendlyInLine(actor:Actor,target:Actor,actors:Actor[]){
  const dx=target.x-actor.x,dz=target.z-actor.z,len=dx*dx+dz*dz;if(len<.01)return false;
  const fromY=actor.y+(actor.crouch?1.1:1.6),toY=target.y+(target.crouch?1.05:1.5);
  return actors.some(ally=>{
    if(ally===actor||ally.team!==actor.team||!ally.alive)return false;
    const t=((ally.x-actor.x)*dx+(ally.z-actor.z)*dz)/len;if(t<.03||t>.97)return false;
    const y=fromY+(toY-fromY)*t;
    return y>ally.y+.1&&y<ally.y+(ally.crouch?1.25:1.9)&&Math.hypot(ally.x-actor.x-dx*t,ally.z-actor.z-dz*t)<.48;
  });
}
export function shotDistance(point:Vec3,shot:Noise){
  if(!shot.direction||!shot.length)return Infinity;
  const origin={x:shot.x,y:shot.y??1.6,z:shot.z},d=shot.direction;
  const t=clamp((point.x-origin.x)*d.x+(point.y-origin.y)*d.y+(point.z-origin.z)*d.z,0,shot.length);
  return Math.hypot(point.x-origin.x-d.x*t,point.y-origin.y-d.y*t,point.z-origin.z-d.z*t);
}
export function chooseCover(actor:Actor,threat:Vec2&{y?:number},points:Vec2[],map:MapData,actors:Actor[]){
  const eye={...threat,y:(threat.y??0)+1.6},candidates=points.filter(p=>distance(p,actor)<17).sort((a,b)=>distance(a,actor)-distance(b,actor)).slice(0,24);
  let best:Vec2|null=null,score=-Infinity;
  for(const p of candidates){
    if(visible(eye,{...p,y:1.03},map.props))continue;
    const occupied=actors.filter(a=>a!==actor&&a.team===actor.team&&a.alive&&distance(a,p)<2.3).length;
    const s=32-distance(actor,p)*1.25+Math.min(distance(threat,p),24)*.3-occupied*18;
    if(s>score){score=s;best=p;}
  }return best;
}
export function choosePeek(cover:Vec2,threat:Vec2&{y?:number},map:MapData,side:number){
  const dx=threat.x-cover.x,dz=threat.z-cover.z,len=Math.max(.01,Math.hypot(dx,dz));
  for(const sign of [side,-side])for(const amount of [.9,1.5,2.1]){
    const p={x:cover.x+dz/len*sign*amount,z:cover.z-dx/len*sign*amount};
    if(!circleBlocked(p,.45,map.props)&&Math.abs(p.x)<map.width/2-.6&&Math.abs(p.z)<map.depth/2-.6&&visible({...p,y:1.55},{...threat,y:(threat.y??0)+1.5},map.props))return p;
  }return null;
}
export function escapeGrenade(actor:Vec2,hazard:Vec2,map:MapData){
  const away=Math.atan2(actor.z-hazard.z,actor.x-hazard.x);let best:Vec2|null=null,score=-Infinity;
  for(const offset of [0,.5,-.5,1,-1,1.6,-1.6,Math.PI]){
    const p={x:clamp(actor.x+Math.cos(away+offset)*8,-map.width/2+.7,map.width/2-.7),z:clamp(actor.z+Math.sin(away+offset)*8,-map.depth/2+.7,map.depth/2-.7)};
    if(circleBlocked(p,.45,map.props))continue;
    let clear=true;for(let i=1;i<=12;i++){const f=i/12;if(circleBlocked({x:actor.x+(p.x-actor.x)*f,z:actor.z+(p.z-actor.z)*f},.42,map.props)){clear=false;break;}}
    const s=distance(p,hazard)+(clear?12:0)-distance(actor,p)*.2;if(s>score){score=s;best=p;}
  }return best;
}
