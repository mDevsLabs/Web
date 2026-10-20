import {freshMatchStats} from '../match-stats.ts';
import {normalizeMatchConfig,teamCounts} from '../match-config.ts';
import {circleBlocked} from '../math.ts';
import { normalizeCareer } from '../../lib/game/career.js';
import { normalizeCollection,ownsWeapon } from '../../lib/game/shop-catalog.js';
import type { Actor } from '../ai.ts';
import { BotBrain,createActor } from '../ai.ts';
import { reloadProgress } from '../combat-motion.ts';
import { SupplyVisuals,disposeEquipment } from '../equipment.ts';
import { landscapeBlocked } from '../landscape.ts';
import { createMap } from '../maps.ts';
import { clamp,damp,distance,visible } from '../math.ts';
import { collectSupply,createSupplies,hardpointAt,pointControl } from '../mission.ts';
import { Navigation } from '../navigation.ts';
import { aimSoldierArms } from '../render/soldier-pose.ts';
import { captureObjective,outcome,tickObjectives } from '../rules.ts';
import { COYOTE_TIME } from '../traversal.ts';
import type { MatchConfig,MatchResult,Team } from '../types.ts';
import { MODES,WEAPONS,weaponById } from '../types.ts';
import { animateWeaponParts } from '../viewmodel.ts';
import { World,createSoldier,disposeModel } from '../world.ts';

import type { Game } from '../game.ts';
const NAMES=['GHOST','NOVA','REAPER','ECHO','VIPER','ATLAS','BISHOP','ROOK','HAVOC','SPECTRE','FROST','RAVEN','HUNTER','JAEGER','ORION','COBRA','ONYX','TALON','VENOM','WOLF'];
export function setMap(this:Game,id:MatchConfig['map']):void{if(this.world.map.id===id)return;this.world.dispose();this.world=new World(this.scene,createMap(id),this.mobile);this.nav=new Navigation(this.world.map.width,this.world.map.depth,this.world.map.props);this.world.setObjectivesVisible(this.state!=='menu'&&(this.config.mode==='domination'||this.config.mode==='hardpoint'));this.applySettings(this.settings);}
export function menuMap(this:Game,id:MatchConfig['map']):void{if(this.state==='menu')this.setMap(id);}
export function clearActors(this:Game):void{for(const v of this.visuals.values()){this.scene.remove(v.root);disposeModel(v.root);}this.visuals.clear();this.actors=[];this.brains=[];for(const g of this.grenades){this.scene.remove(g.mesh);disposeEquipment(g.mesh);}this.grenades=[];this.supplyVisuals?.dispose();this.supplyVisuals=null;this.supplies=[];this.orders.clear();this.effects.clear();}
export function start(this:Game,config:MatchConfig):void{
    if(landscapeBlocked(this.mobile)){this.hooks.event('notice',{text:'Tournez votre téléphone en paysage pour jouer.'});return;}
    try{this.audio.init();}catch{this.hooks.event('notice',{text:'Audio indisponible : la partie continue sans son.'});}this.touch.reset();this.clearActors();this.weaponXP={};this.collection=normalizeCollection(this.collection,10_000_000);this.career=normalizeCareer(this.career,this.collection);this.config={...normalizeMatchConfig(config),weapon:this.career.loadout.includes(config.weapon)&&ownsWeapon(this.collection,config.weapon)?config.weapon:this.career.loadout.find(id=>WEAPONS.some(w=>w.id===id))!};config=this.config;this.setMap(config.map);this.stats=freshMatchStats();this.time=0;this.matchTime=0;this.score=[0,0];this.wave=1;this.waveNext=0;this.streak=0;this.bestStreak=0;this.shots=0;this.hits=0;this.playerScore=0;this.scoreTick=0;this.respawns=0;this.noises=[];this.intel=[new Map(),new Map()];this.stamina=100;this.adaptiveScale=1;this.resize();
    this.player=createActor(0,this.settings.callsign||'OPÉRATEUR',0,weaponById(config.weapon),true);this.actors=[this.player];this.inventory.clear();for(const w of WEAPONS.filter(w=>this.career.loadout.includes(w.id)))this.inventory.set(w.id,{ammo:w.mag,reserve:w.reserve});this.spawn(this.player);this.switchWeapon(config.weapon);const self=createSoldier(0,this.player.weapon,this.career.appearance.self,this.progress?.[this.player.weapon.id]?.skin??'factory');this.visuals.set(0,self);this.scene.add(self.root);this.grenadeCount=this.career.loadout.includes('grenade')?2:0;this.medkitCount=this.career.loadout.includes('medkit')?1:0;this.velocityY=0;this.grounded=true;this.eyeHeight=1.63;this.keys.clear();this.mouseDown=false;this.aimDown=false;this.hitTime=0;this.damageFlash=0;this.waveNext=0;
    this.objectives=this.world.map.objectives.map((p,i)=>({...p,id:String.fromCharCode(65+i),owner:-1,progress:0,contested:false}));this.pointIndex=-1;this.holdTime=0;this.nextSquad=0;this.orders=new Map();this.world.setObjectivesVisible(config.mode==='domination'||config.mode==='hardpoint',config.mode==='hardpoint'?hardpointAt(0).index:undefined);
    this.supplies=createSupplies(this.world.map,this.nav);this.supplyVisuals=new SupplyVisuals(this.scene,this.supplies);
    const counts=teamCounts(config);for(let i=1;i<=counts.allies;i++)this.addBot(i,0);if(config.mode==='survival')this.spawnWave();else for(let i=1;i<=counts.enemies;i++)this.addBot(counts.allies+i,1);
    this.setState('playing');this.hooks.event('start',{mode:MODES[config.mode].name,map:this.world.map.name});if(!this.mobile)this.lockMouse();
  }
export function addBot(this:Game,id:number,team:Team):void{const w=WEAPONS[id%5===0?2:id%4===0?1:0],a=createActor(id,NAMES[(id-1)%NAMES.length]+(id>20?'-'+id:''),team,w);this.spawn(a);if(this.config.mode==='survival')a.hp=100+Math.min(60,(this.wave-1)*6);const v=createSoldier(team,w,this.career.appearance[team===0?'ally':'enemy']);this.visuals.set(id,v);this.scene.add(v.root);this.actors.push(a);this.brains.push(new BotBrain(a,this.config.difficulty,this.world.map));}
export function spawn(this:Game,a:Actor):void{
    const spots=this.world.map.spawns[a.team],others=this.actors.filter(o=>o!==a&&o.alive),enemies=others.filter(o=>o.team!==a.team),friends=others.filter(o=>o.team===a.team);let p=spots[0],bestScore=-Infinity;
    for(const spot of spots)for(const dx of [-3,0,3])for(const dz of [-3,0,3]){const cell=this.nav.nearest({x:spot.x+dx,z:spot.z+dz});if(cell<0)continue;const candidate=this.nav.point(cell);if(circleBlocked(candidate,.36,this.world.map.props,0,1.63))continue;const enemy=enemies.length?Math.min(...enemies.map(e=>distance(e,candidate))):20,space=friends.length?Math.min(...friends.map(f=>distance(f,candidate))):10,score=enemy+Math.min(5,space)*2-(space<.85?100:0)+Math.random()*.2;if(score>bestScore){bestScore=score;p=candidate;}}
    Object.assign(a,{x:p.x,y:0,z:p.z,hp:100,alive:true,vx:0,vz:0,yaw:a.team===0?Math.PI*.72:-Math.PI*.28,pitch:0,ammo:a.weapon.mag,reserve:a.weapon.reserve,reloadTime:0,fireTime:0,crouch:false,protectedTime:2.25,respawnTime:0,lastDamaged:-99,shotAge:10});a.damageFrom.clear();if(a.player){this.climbExit=null;this.climbEntry=null;this.ladderPaused=false;this.activeLadder=null;this.jumpBuffer=0;this.fireBuffer=0;this.coyoteTime=COYOTE_TIME;this.aimAmount=0;this.camera.fov=this.settings.fov;this.grenadeCount=this.career.loadout.includes('grenade')?2:0;this.medkitCount=this.career.loadout.includes('medkit')?1:0;this.velocityY=0;this.grounded=true;this.shotPulse=0;this.viewKick=0;this.reloadStage=0;animateWeaponParts(this.gun,1,0);this.gun.visible=true;this.inventory.clear();for(const w of WEAPONS.filter(w=>this.career.loadout.includes(w.id)))this.inventory.set(w.id,{ammo:w.mag,reserve:w.reserve});}
  }
export function spawnWave(this:Game):void{for(const a of this.actors.filter(a=>a.team===1)){const v=this.visuals.get(a.id);if(v){this.scene.remove(v.root);disposeModel(v.root);this.visuals.delete(a.id);}}this.actors=this.actors.filter(a=>a.team===0);this.brains=this.brains.filter(b=>b.actor.team===0);const counts=teamCounts(this.config);for(let i=1;i<=counts.enemies;i++)this.addBot(counts.allies+i,1);this.hooks.event('wave',{wave:this.wave,count:counts.enemies});this.audio.tone(180,.3,'triangle',.15);}
export function updateModes(this:Game,dt:number):void{
    if(this.config.mode==='hardpoint'){
      const rotation=hardpointAt(this.matchTime,this.objectives.length),o=this.objectives[rotation.index];
      if(this.pointIndex!==rotation.index){this.pointIndex=rotation.index;this.holdTime=0;this.world.setObjectivesVisible(true,rotation.index);this.hooks.event('rotation',{id:o.id,next:this.objectives[rotation.nextIndex].id});}
      for(const other of this.objectives)if(other!==o){other.owner=-1;other.progress=0;other.contested=false;}
      const control=pointControl(o,this.actors);o.owner=control.owner as Team|-1;o.contested=control.contested;o.progress=o.owner===0?1:o.owner===1?-1:0;this.world.setObjective(rotation.index,o.owner,o.contested);
      this.scoreTick+=dt;while(this.scoreTick>=1){this.scoreTick-=1;if(o.owner!==-1&&!o.contested)this.score[o.owner]++;}
      if(this.player.alive&&this.player.y<1.5&&o.owner===this.player.team&&distance(this.player,o)<3.6){this.stats??=freshMatchStats();this.stats.objectiveSeconds+=dt;this.holdTime+=dt;if(this.holdTime>=5){this.holdTime-=5;this.playerScore+=25;this.hooks.event('points',{points:25,text:'POINT STRATÉGIQUE TENU'});}}else this.holdTime=0;
    }
    if(this.config.mode==='domination'){
      for(let i=0;i<this.objectives.length;i++){const o=this.objectives[i],counts:[number,number]=[0,0];for(const a of this.actors)if(a.alive&&a.y<1.5&&distance(a,o)<3.6)counts[a.team]++;const old=o.owner;captureObjective(o,counts,dt);
        if(old!==o.owner&&o.owner!==-1){this.hooks.event('capture',{id:o.id,team:o.owner});this.audio.tone(o.owner===0?660:220,.2,'triangle',.1);if(o.owner===0&&this.player.alive&&this.player.y<1.5&&distance(this.player,o)<3.6){this.stats??=freshMatchStats();this.stats.captures++;this.playerScore+=200;this.hooks.event('points',{points:200,text:`POINT ${o.id} CAPTURÉ`});}}
        if(o.owner===0&&!o.contested&&this.player.alive&&this.player.y<1.5&&distance(this.player,o)<3.6){this.stats??=freshMatchStats();this.stats.objectiveSeconds+=dt;}this.world.setObjective(i,o.owner,o.contested);
      }
      this.scoreTick+=dt;while(this.scoreTick>=1){this.scoreTick-=1;tickObjectives(this.score,this.objectives);}
    }
    if(this.config.mode==='survival'){
      const live=this.actors.some(a=>a.team===1&&a.alive);if(!live&&this.player.alive&&this.waveNext<=0){this.waveNext=5;this.playerScore+=250;this.hooks.event('points',{points:250,text:'VAGUE TERMINÉE'});this.player.hp=100;this.player.ammo=this.player.weapon.mag;this.player.reserve=this.player.weapon.reserve;this.grenadeCount=this.career.loadout.includes('grenade')?2:0;this.medkitCount=this.career.loadout.includes('medkit')?1:0;this.stamina=100;}
      if(this.waveNext>0){this.waveNext-=dt;if(this.waveNext<=0&&this.player.alive){this.wave++;this.spawnWave();}}
      return;
    }
    const result=outcome(this.score,this.config.mode,this.matchTime,this.config.duration);if(result)this.finish(result==='win',result==='draw');
  }
export function updateVisuals(this:Game,dt:number):void{
    for(const a of this.actors){
      const v=this.visuals.get(a.id);if(!v)continue;
      v.root.visible=a.player?(this.thirdPerson()||this.settings.cameraMode==='third'&&!a.alive):a.alive||a.respawnTime>1;if(!v.root.visible)continue;v.root.position.set(a.x,a.y,a.z);v.root.rotation.y=a.yaw;
      if(!a.alive){v.root.position.y=a.y+.28;v.root.rotation.z=damp(v.root.rotation.z,1.5,6,dt);continue;}
      const pose=animateWeaponParts(v.weapon,reloadProgress(a.reloadTime,a.weapon.reload),Math.max(0,1-a.shotAge*20));
      if(Math.abs(v.root.rotation.z)>.3)v.root.rotation.z=0;v.root.scale.y=damp(v.root.scale.y,a.crouch?.75:1,10,dt);
      const speed=Math.hypot(a.vx,a.vz),moving=speed>1,swing=moving?Math.sin(this.time*(speed>4.5?12:8)+a.id)*(a.crouch?.25:.48):0;
      const lateral=a.vx*Math.cos(a.yaw)-a.vz*Math.sin(a.yaw);v.root.rotation.z=damp(v.root.rotation.z,clamp(-lateral*.018,-.1,.1),8,dt);v.root.position.y+=moving?Math.abs(Math.sin(this.time*9+a.id))*.027:Math.sin(this.time*2+a.id)*.007;
      v.leftLeg.rotation.x=swing;v.rightLeg.rotation.x=-swing;v.leftLeg.rotation.z=-.018;v.rightLeg.rotation.z=.018;v.head.rotation.x=a.pitch*.6;v.head.rotation.y=a.tacticalState==='search'?Math.sin(this.time*1.4+a.id)*.25:0;
      v.weapon.rotation.x=a.pitch+pose.pitch*.6;v.weapon.position.y=1.16-pose.drop;
      aimSoldierArms(v);
    }
  }
export function updateSupplies(this:Game):void{
    for(const s of this.supplies){if(s.readyAt>this.time)continue;for(const a of this.actors){const hp=a.hp;if(!a.alive||distance(a,s)>1.45||Math.abs(a.y)>.8||!visible(this.eye(a),{x:s.x,y:.3,z:s.z},this.world.map.props)||!collectSupply(a,s,this.time))continue;
      if(a.player){this.stats??=freshMatchStats();this.stats.supplies++;this.stats.healing+=Math.max(0,a.hp-hp);this.inventory.set(a.weapon.id,{ammo:a.ammo,reserve:a.reserve});this.audio.tone(s.kind==='medical'?740:520,.13,'triangle',.1);this.hooks.event('supply',{kind:s.kind});}break;
    }}this.supplyVisuals?.update(this.supplies,this.time);
  }
export function finish(this:Game,victory:boolean,draw=false):void{if(this.state==='ending'||this.state==='menu')return;const result:MatchResult={stats:{...(this.stats??freshMatchStats())},shots:this.shots,hits:this.hits,bestStreak:this.bestStreak,map:this.config.map,teamScore:[...this.score],roster:this.actors.map(({id,name,team,player,kills,deaths,assists})=>({id,name,team,player,kills,deaths,assists})),mode:this.config.mode,victory,draw,kills:this.player.kills,deaths:this.player.deaths,assists:this.player.assists,accuracy:this.shots?Math.round(this.hits/this.shots*100):0,score:this.playerScore,wave:this.wave,duration:this.matchTime,weaponXP:{...this.weaponXP},xp:Math.round(this.player.kills*100+this.player.assists*40+this.playerScore*.15+(victory?350:draw?200:100))};this.setState('ending');if(this.locked)document.exitPointerLock();this.keys.clear();this.mouseDown=false;this.aimDown=false;this.hooks.end(result);this.audio.tone(victory?660:220,.7,'triangle',.18);}
