import { angleDiff,circleBlocked,distance,moveCircle,seeded,visible } from './math.ts';
import type { Supply } from './mission.ts';
import type { Navigation } from './navigation.ts';
import * as npcDecisions from './npc-decisions.ts';
import { steerCrowd } from './npc-steering.ts';
import type { SquadOrder,TacticalRole } from './squad.ts';
import { roleFor } from './squad.ts';
import { friendlyInLine } from './tactics.ts';
import type { Difficulty,MapData,Objective,Team,Vec2,Vec3,WeaponSpec } from './types.ts';

export interface Actor extends Vec3 {
  id:number;name:string;team:Team;player:boolean;alive:boolean;hp:number;yaw:number;pitch:number;
  vx:number;vz:number;crouch:boolean;weapon:WeaponSpec;ammo:number;reserve:number;
  reloadTime:number;fireTime:number;respawnTime:number;protectedTime:number;
  shotAge:number;
  tacticalState?:BrainState;
  kills:number;deaths:number;assists:number;damageFrom:Map<number,number>;lastDamaged:number;
}
export type BrainState='patrol'|'investigate'|'engage'|'flank'|'cover'|'peek'|'evade'|'capture'|'search'|'hold'|'rotate'|'retreat'|'resupply';
export interface Noise extends Vec2 {team:Team;time:number;y?:number;direction?:Vec3;length?:number;kind?:'shot'|'step';radius?:number;}
export interface AIContext {
  time:number;map:MapData;nav:Navigation;actors:Actor[];objectives:Objective[];mode:string;
  noises:Noise[];shoot:(actor:Actor,direction:Vec3)=>void;
  hazards?:{position:Vec3;remaining:number;team:Team}[];
  supplies?:Supply[];orders?:Map<number,SquadOrder>;
  intel?:[Map<number,{position:Vec2;time:number}>,Map<number,{position:Vec2;time:number}>];
  grenade?:(actor:Actor,target:Vec3)=>void;
}
export function createActor(id:number,name:string,team:Team,weapon:WeaponSpec,player=false):Actor {
  return {id,name,team,weapon,player,x:0,y:0,z:0,vx:0,vz:0,hp:100,yaw:0,pitch:0,alive:true,crouch:false,ammo:weapon.mag,reserve:weapon.reserve,reloadTime:0,fireTime:0,respawnTime:0,protectedTime:2.5,shotAge:10,kills:0,deaths:0,assists:0,damageFrom:new Map(),lastDamaged:-99};
}
export class BotBrain {
  state:BrainState='patrol';path:Vec2[]=[];waypoint=0;goal:Vec2|null=null;target:Actor|null=null;
  lastKnown:Vec2|null=null;memoryUntil=0;nextThink=0;nextPath=0;reaction=0;strafe=1;strafeUntil=0;
  role:TacticalRole;coverPoints:Vec2[]=[];lastNoise=-1;stuckTime=0;searchUntil=0;lastStep=0;visibleThreats=0;
  cover:Vec2|null=null;coverUntil=0;suppression=0;burstLeft=3;burstPause=0;heard=new WeakSet<Noise>();
  readonly accuracy:number;readonly delay:number;readonly sight:number;readonly rand:()=>number;
  grenades=1;nextGrenade=0;
  constructor(readonly actor:Actor,readonly difficulty:Difficulty,map:MapData){
    this.role=roleFor(actor.id);this.rand=seeded(0xb1ac+actor.id*179+(difficulty==='veteran'?7:0));
    this.accuracy=difficulty==='recruit'?.095:difficulty==='veteran'?.018:.045;
    this.delay=difficulty==='recruit'?.7:difficulty==='veteran'?.24:.43;this.sight=difficulty==='recruit'?38:difficulty==='veteran'?65:50;this.nextThink=this.rand()*.2;
    for(const box of map.props.filter(p=>!p.collisionOnly&&p.y===undefined))for(const side of [-1,1]){
      const points=[{x:box.x+side*(box.w/2+.9),z:box.z},{x:box.x,z:box.z+side*(box.d/2+.9)},
        {x:box.x+side*(box.w/2+.85),z:box.z+box.d/2+.75},{x:box.x+side*(box.w/2+.85),z:box.z-box.d/2-.75}];
      for(const p of points)if(Math.abs(p.x)<map.width/2-.8&&Math.abs(p.z)<map.depth/2-.8&&!circleBlocked(p,.49,map.props))this.coverPoints.push(p);
    }
  }
  reset(){this.state='patrol';this.path=[];this.goal=null;this.target=null;this.lastKnown=null;this.memoryUntil=0;this.reaction=0;this.stuckTime=0;this.grenades=1;this.nextGrenade=0;this.cover=null;this.coverUntil=0;this.suppression=0;this.burstLeft=3;this.burstPause=0;this.heard=new WeakSet();this.nextThink=0;this.nextPath=0;this.searchUntil=0;this.lastStep=0;this.visibleThreats=0;}
  eye(a:Actor):Vec3{return {x:a.x,y:a.y+(a.crouch?1.1:1.6),z:a.z};}
  perceive(ctx:AIContext):void{return npcDecisions.perceive.call(this,ctx);}
  chooseGoal(ctx:AIContext):void{return npcDecisions.chooseGoal.call(this,ctx);}
  setGoal(p:Vec2){if(!this.goal||distance(this.goal,p)>2){this.goal={x:p.x,z:p.z};this.nextPath=0;}}
  clearGoal(){this.goal=null;this.path=[];this.waypoint=0;}
  step(dt:number,ctx:AIContext){
    const a=this.actor;if(!a.alive)return;a.shotAge+=dt;
    a.fireTime=Math.max(0,a.fireTime-dt);a.protectedTime=Math.max(0,a.protectedTime-dt);this.reaction=Math.max(0,this.reaction-dt);this.burstPause=Math.max(0,this.burstPause-dt);this.suppression=Math.max(0,this.suppression-dt*.25);
    if(a.reloadTime>0){a.reloadTime=Math.max(0,a.reloadTime-dt);if(a.reloadTime===0){const n=Math.min(a.weapon.mag-a.ammo,a.reserve);a.ammo+=n;a.reserve-=n;}}
    if(a.ammo<=0&&a.reloadTime<=0&&a.reserve>0)a.reloadTime=a.weapon.reload;
    if(this.target&&!visible(this.eye(a),this.eye(this.target),ctx.map.props)){this.target=null;this.reaction=this.delay;this.nextThink=Math.min(this.nextThink,ctx.time+.05);}
    if(this.target&&(!this.target.alive||this.target.team===a.team||this.target.protectedTime>0)){this.target=null;this.nextThink=0;this.reaction=this.delay;}
    if(ctx.time>=this.nextThink){this.perceive(ctx);this.chooseGoal(ctx);this.nextThink=ctx.time+.17+this.rand()*.05;
      if(a.reloadTime<=0&&a.ammo<a.weapon.mag*.28&&a.reserve>0&&(!this.target||this.state==='cover'))a.reloadTime=a.weapon.reload;
    }
    a.tacticalState=this.state;
    // Empty/unreachable paths are retried on a timer, not on every render frame.
    if(this.goal&&ctx.time>=this.nextPath){this.path=ctx.nav.path(a,this.goal);this.waypoint=0;this.nextPath=ctx.time+1.15+this.rand()*.55;}
    let mx=0,mz=0;
    if(this.path.length){let next=this.path[this.waypoint];while(next&&distance(a,next)<.6){this.waypoint++;next=this.path[this.waypoint];}if(next){const d=Math.max(.1,distance(a,next));mx=(next.x-a.x)/d;mz=(next.z-a.z)/d;}}
    if(this.target){
      const t=this.target,dx=t.x-a.x,dz=t.z-a.z,dy=(t.y+(t.crouch?1.05:1.48))-(a.y+(a.crouch?1.1:1.55)),d=Math.hypot(dx,dz),desired=Math.atan2(-dx,-dz);
      a.yaw+=angleDiff(desired,a.yaw)*Math.min(1,dt*(this.difficulty==='veteran'?12:7));a.pitch=Math.atan2(dy,Math.max(1,d));
      if(this.state==='engage'&&d<22){if(ctx.time>this.strafeUntil){this.strafe=this.rand()>.5?1:-1;this.strafeUntil=ctx.time+.8+this.rand();}mx=dz/Math.max(1,d)*this.strafe*.62;mz=-dx/Math.max(1,d)*this.strafe*.62;if(d<7){mx-=dx/Math.max(1,d)*.5;mz-=dz/Math.max(1,d)*.5;}}
      const canSee=visible(this.eye(a),this.eye(t),ctx.map.props);
      if(this.state!=='evade'&&this.reaction<=0&&this.burstPause<=0&&a.fireTime<=0&&a.reloadTime<=0&&a.ammo>0&&Math.abs(angleDiff(desired,a.yaw))<.18&&canSee&&!friendlyInLine(a,t,ctx.actors)){
        const error=this.accuracy*(d>30?1.3:1)*(a.weapon.id==='dmr'?.8:1)*(1+this.suppression*1.2)*(Math.hypot(a.vx,a.vz)>4?1.25:1),prediction=this.difficulty==='veteran'?.08:.025;
        const tx=dx+t.vx*prediction+(this.rand()-.5)*error*d,tz=dz+t.vz*prediction+(this.rand()-.5)*error*d,ty=dy+(this.rand()-.5)*error*d*.45,l=Math.max(.01,Math.hypot(tx,ty,tz));
        ctx.shoot(a,{x:tx/l,y:ty/l,z:tz/l});a.fireTime=a.weapon.fireInterval*(this.difficulty==='recruit'?2.1:this.difficulty==='regular'?1.5:1.1);
        if(--this.burstLeft<=0){this.burstLeft=a.weapon.automatic?(a.weapon.id==='smg'?6:3):1;this.burstPause=this.difficulty==='recruit'?.65:this.difficulty==='veteran'?.22:.38;}
      }
      if(ctx.grenade&&this.state!=='evade'&&this.grenades>0&&ctx.time>this.nextGrenade&&ctx.time>8&&d>14&&d<27&&this.reaction<=0&&a.reloadTime<=0&&canSee){this.nextGrenade=ctx.time+7;if(!ctx.actors.some(ally=>ally.team===a.team&&ally.alive&&distance(ally,t)<7)&&this.rand()<(this.difficulty==='veteran'?.65:this.difficulty==='regular'?.35:.15)){ctx.grenade(a,{x:t.x,y:t.y+.3,z:t.z});this.grenades--;}}
    }else if(Math.hypot(mx,mz)>.1){a.yaw+=angleDiff(Math.atan2(-mx,-mz),a.yaw)*Math.min(1,dt*5);a.pitch=0;}
    else if(this.state==='search'||this.state==='hold'){a.yaw+=Math.sin(ctx.time*.9+a.id)*dt*.65;a.pitch=Math.sin(ctx.time*.5+a.id)*.025;}
    a.crouch=this.state==='cover'&&(!this.goal||distance(a,this.goal)<1.7);
    for(const other of ctx.actors){if(other===a||!other.alive||Math.abs(other.y-a.y)>1.4)continue;const d=distance(a,other);if(d<1.05&&d>.02){mx+=(a.x-other.x)/d*(1.05-d);mz+=(a.z-other.z)/d*(1.05-d);}}
    const steering=steerCrowd(a,mx,mz,ctx.actors);mx=steering.x;mz=steering.z;
    const speed=(this.state==='evade'||this.state==='retreat'||this.state==='rotate'?5.5:a.crouch?1.8:this.target?3.6:4.1)*a.weapon.mobility,len=Math.max(1,Math.hypot(mx,mz));
    const moved=moveCircle(a,mx/len*speed*dt,mz/len*speed*dt,.39,ctx.map.props,ctx.map.width,ctx.map.depth);
    a.vx=(moved.x-a.x)/Math.max(.0001,dt);a.vz=(moved.z-a.z)/Math.max(.0001,dt);a.x=moved.x;a.z=moved.z;
    if(!a.crouch&&Math.hypot(a.vx,a.vz)>2&&ctx.time-this.lastStep>.55){this.lastStep=ctx.time;ctx.noises.push({x:a.x,y:a.y+.2,z:a.z,team:a.team,time:ctx.time,kind:'step',radius:this.state==='retreat'||this.state==='evade'?15:10});if(ctx.noises.length>80)ctx.noises.shift();}
    if(Math.hypot(a.vx,a.vz)<.3&&this.goal&&distance(a,this.goal)>2)this.stuckTime+=dt;else this.stuckTime=0;
    if(this.stuckTime>1.7){this.nextPath=0;this.clearGoal();this.lastKnown=null;this.cover=null;this.stuckTime=0;this.nextThink=0;}
    if(a.hp<100&&ctx.time-a.lastDamaged>6)a.hp=Math.min(100,a.hp+dt*9);
  }
}
