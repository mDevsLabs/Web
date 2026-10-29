import { angleDiff,clamp,distance,visible } from './math.ts';
import { hardpointAt } from './mission.ts';
import { chooseCover,choosePeek,escapeGrenade,shotDistance } from './tactics.ts';


import type { AIContext,Actor,BotBrain } from './ai.ts';
export function perceive(this:BotBrain,ctx:AIContext):void{
    const a=this.actor,eye=this.eye(a);let best:Actor|null=null,score=-Infinity;this.visibleThreats=0;
    for(const target of ctx.actors){
      if(!target.alive||target.team===a.team||target.protectedTime>0)continue;const d=distance(a,target);if(d>this.sight)continue;
      const yaw=Math.atan2(-(target.x-a.x),-(target.z-a.z));
      if(d>8&&Math.abs(angleDiff(yaw,a.yaw))>1.4&&ctx.time-a.lastDamaged>1.5&&this.target!==target)continue;
      if(!visible(eye,this.eye(target),ctx.map.props))continue;
      this.visibleThreats++;
      const recentAttacker=ctx.time-(a.damageFrom.get(target.id)??-99)<3;
      const s=65-d+(target===this.target?12:0)+(recentAttacker?18:0)+(target.reloadTime>0?4:0);
      if(s>score){score=s;best=target;}
    }
    if(best){if(this.target!==best){this.reaction=this.delay;this.burstLeft=3;}this.target=best;this.lastKnown={x:best.x,z:best.z};this.memoryUntil=ctx.time+6;ctx.intel?.[a.team].set(best.id,{position:{x:best.x,z:best.z},time:ctx.time});}
    else {this.target=null;if(this.memoryUntil<ctx.time)this.lastKnown=null;}
    // Squad reports contain observed snapshots; never read the hidden actor's current position.
    if(!best&&!this.lastKnown&&ctx.intel){const reports=[...ctx.intel[a.team].values()].filter(r=>ctx.time-r.time<3&&distance(a,r.position)<40).sort((a,b)=>b.time-a.time);if(reports.length){this.lastKnown={...reports[0].position};this.memoryUntil=ctx.time+2;}}
    for(const noise of ctx.noises){
      if(this.heard.has(noise)||noise.team===a.team||ctx.time-noise.time>2.5)continue;this.heard.add(noise);
      if(shotDistance({...eye,y:eye.y-.2},noise)<1.5)this.suppression=Math.min(1,this.suppression+.4);
      const clear=visible(eye,{x:noise.x,y:noise.y??1.3,z:noise.z},ctx.map.props),radius=(noise.radius??(ctx.time-a.lastDamaged<2?52:34))*(clear?1:.42);
      if(distance(a,noise)<radius){if(!best){const error=noise.kind==='step'?.85:0;this.lastKnown={x:noise.x+(this.rand()-.5)*error,z:noise.z+(this.rand()-.5)*error};this.memoryUntil=ctx.time+(noise.kind==='step'?2.3:4);}this.lastNoise=noise.time;}
    }
  }
export function chooseGoal(this:BotBrain,ctx:AIContext):void{
    const a=this.actor;
    const danger=ctx.hazards?.filter(g=>g.remaining<2.1&&Math.hypot(a.x-g.position.x,a.y+.8-g.position.y,a.z-g.position.z)<8.5&&(distance(a,g.position)<3.5||visible(this.eye(a),g.position,ctx.map.props))).sort((p,q)=>distance(a,p.position)-distance(a,q.position))[0];
    if(danger){const escape=escapeGrenade(a,danger.position,ctx.map);if(escape){this.state='evade';this.setGoal(escape);return;}}
    const friendlySupport=ctx.actors.filter(ally=>ally!==a&&ally.alive&&ally.team===a.team&&distance(a,ally)<12).length;
    const retreat=a.hp<28&&this.visibleThreats>friendlySupport;
    const needed=ctx.supplies?.filter(s=>s.readyAt<=ctx.time&&((s.kind==='medical'&&a.hp<55)||(s.kind==='ammo'&&a.reserve<a.weapon.mag&&a.ammo<a.weapon.mag*.4))).sort((p,q)=>distance(a,p)-distance(a,q))[0];
    if(needed&&(!this.target||retreat||a.ammo===0)){
      this.state=retreat?'retreat':'resupply';this.setGoal(needed);return;
    }
    const threat=this.target??this.lastKnown,needCover=a.hp<38||a.reloadTime>0||this.suppression>.55||a.ammo<=0;
    if(threat&&needCover){
      if(!this.cover||ctx.time>this.coverUntil||visible({...threat,y:('y' in threat?Number(threat.y):0)+1.6},{...this.cover,y:1.03},ctx.map.props)){this.cover=chooseCover(a,threat,this.coverPoints,ctx.map,ctx.actors);this.coverUntil=ctx.time+2.3;}
      if(this.cover){this.state='cover';this.setGoal(this.cover);return;}
    }
    if(this.target){
      const t=this.target,d=distance(a,t);
      if(this.cover&&ctx.time<this.coverUntil){const peek=choosePeek(this.cover,t,ctx.map,a.id%2?1:-1);if(peek){this.state='peek';this.setGoal(peek);return;}}
      const order=ctx.orders?.get(a.id);
      if(order&&order.expires>=ctx.time&&order.kind==='flank'&&d>12&&distance(order.position,t)<13){this.state='flank';this.setGoal(order.position);}
      else if(this.role==='anchor'&&order?.kind==='hold'&&order.expires>=ctx.time&&distance(a,order.position)<7&&d>8){this.state='hold';this.setGoal(order.position);}
      else if(this.role==='flanker'&&d>14&&(ctx.time+a.id)%8<3){
        const side=a.id%2?1:-1,dx=t.x-a.x,dz=t.z-a.z;
        this.state='flank';this.setGoal({x:clamp(t.x+dz/d*side*8,-ctx.map.width/2+1,ctx.map.width/2-1),z:clamp(t.z-dx/d*side*8,-ctx.map.depth/2+1,ctx.map.depth/2-1)});
      }else {this.state='engage';if(d>22)this.setGoal(t);else this.clearGoal();}return;
    }
    if(this.lastKnown){
      if(this.cover&&ctx.time<this.coverUntil&&a.reloadTime<=0){const peek=choosePeek(this.cover,this.lastKnown,ctx.map,a.id%2?1:-1);if(peek){this.state='peek';this.setGoal(peek);return;}}
      const order=ctx.orders?.get(a.id);this.state=order?.kind==='flank'?'flank':'investigate';this.setGoal(order?.kind==='flank'&&order.expires>=ctx.time?order.position:this.lastKnown);if(distance(a,this.lastKnown)<2){this.lastKnown=null;this.memoryUntil=0;this.clearGoal();this.searchUntil=ctx.time+1.8;this.state='search';}return;
    }
    if(this.searchUntil>ctx.time){this.state='search';this.clearGoal();return;}
    const order=ctx.orders?.get(a.id);
    if(order&&order.expires>=ctx.time){this.state=order.kind==='hold'?'hold':order.kind==='rotate'?'rotate':order.kind==='flank'?'flank':'capture';this.setGoal(order.position);return;}
    if(ctx.mode==='hardpoint'&&ctx.objectives.length){this.state='capture';this.setGoal(ctx.objectives[hardpointAt(ctx.time,ctx.objectives.length).index]);return;}
    if(ctx.mode==='domination'&&ctx.objectives.length){
      let best=ctx.objectives[0],score=-Infinity;
      for(let i=0;i<ctx.objectives.length;i++){const o=ctx.objectives[i],allies=ctx.actors.filter(ally=>ally!==a&&ally.team===a.team&&ally.alive&&distance(ally,o)<8).length;
        const s=(o.owner!==a.team?34:this.role==='anchor'?33:8)-distance(a,o)*.4+((i+a.id)%3===0?7:0)+(o.contested?14:0)-allies*8;
        if(s>score){score=s;best=o;}
      }this.state='capture';this.setGoal(best);return;
    }
    this.state='patrol';if(!this.goal||distance(a,this.goal)<2){
      const route=ctx.mode==='survival'&&a.team===1&&Math.floor(ctx.time/14)%2?ctx.map.spawns[0]:ctx.map.objectives;
      const p=route[(a.id+Math.floor(ctx.time/11))%route.length];this.setGoal({x:clamp(p.x+(this.rand()-.5)*12,-ctx.map.width/2+1,ctx.map.width/2-1),z:clamp(p.z+(this.rand()-.5)*15,-ctx.map.depth/2+1,ctx.map.depth/2-1)});
    }
  }
