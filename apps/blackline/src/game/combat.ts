import {freshMatchStats} from '../match-stats.ts';
import * as T from 'three';
import { effectColor,ownsWeapon } from '../../lib/game/shop-catalog.js';
import type { Actor } from '../ai.ts';
import { aimDirection,shotSpread } from '../aim.ts';
import { surfaceNormal } from '../combat-motion.ts';
import { clamp } from '../math.ts';
import { upgradedWeapon } from '../progression.ts';
import { scoreElimination } from '../rules.ts';
import type { Vec3 } from '../types.ts';
import { WEAPONS,weaponById } from '../types.ts';
import { animateWeaponParts,setMuzzleColor } from '../viewmodel.ts';
import { createWeapon,disposeModel } from '../world.ts';
import { cameraAimRay } from './camera.ts';
import * as ordnance from './ordnance.ts';
import { spatialDistance,traceShot } from './targeting.ts';

import type { Game } from '../game.ts';
export function switchWeapon(this:Game,id:string):void{if(!WEAPONS.some(w=>w.id===id)||!ownsWeapon(this.collection,id)||this.career&&!this.career.loadout.includes(id)){this.hooks?.event('notice',{text:'Débloquez cette arme dans la boutique.'});return;}const old=this.player.weapon;this.inventory.set(old.id,{ammo:this.player.ammo,reserve:this.player.reserve});const w=upgradedWeapon(weaponById(id),this.progress?.[id]),inv=this.inventory.get(w.id)??{ammo:w.mag,reserve:w.reserve};this.player.weapon=w;this.player.ammo=inv.ammo;this.player.reserve=inv.reserve;this.player.reloadTime=0;this.player.fireTime=.12;this.fireBuffer=0;this.aimAmount=0;this.reloadStage=0;this.shotPulse=0;this.viewKick=0;this.gunScene.remove(this.gun);if(this.gunCache){const skin=this.progress?.[id]?.skin??'factory',key=w.id+':'+skin;const previous=this.gun.userData.weaponId+':'+(this.gun.userData.skin??'factory');if(this.gun.userData.weaponId)this.gunCache.set(previous,this.gun);this.gun=this.gunCache.get(key)??createWeapon(w,true,skin);this.gunCache.set(key,this.gun);while(this.gunCache.size>8){const oldest=[...this.gunCache.keys()].find(k=>k!==key)!;disposeModel(this.gunCache.get(oldest)!);this.gunCache.delete(oldest);}}else {disposeModel(this.gun);this.gun=createWeapon(w,true);}setMuzzleColor(this.gun,effectColor(this.collection?.shot));this.gunScene.add(this.gun);animateWeaponParts(this.gun,1,0);this.recoil=.07;const previousSelf=this.visuals?.get(0);if(previousSelf){previousSelf.root.remove(previousSelf.weapon);disposeModel(previousSelf.weapon);const model=createWeapon(w,false,this.progress?.[w.id]?.skin??'factory');model.scale.setScalar(.8);model.position.set(.10,1.16,-.23);previousSelf.weapon=model;previousSelf.root.add(model);}}

export function reloadPlayer(this:Game):void{const a=this.player;if(!a.alive||a.reloadTime>0||a.ammo>=a.weapon.mag||a.reserve<=0)return;a.reloadTime=a.weapon.reload;this.reloadStage=0;this.audio.reload();this.hooks.event('reload',{});}
export function firePlayer(this:Game,bufferPress=true):void{const a=this.player;if(this.state!=='playing'||!a.alive||a.reloadTime>0||this.activeLadder||this.climbExit)return;if(a.fireTime>1e-6){if(bufferPress&&!a.weapon.automatic&&a.fireTime<=.12)this.fireBuffer=.12;return;}if(a.ammo<1){if(this.settings.autoReload!==false)this.reloadPlayer();return;}
    const spread=shotSpread(a.weapon.spread,this.aimAmount,Math.hypot(a.vx,a.vz),this.grounded,(a.weapon.model??a.weapon.id)==='dmr'),yaw=a.yaw+(Math.random()-.5)*spread,pitch=a.pitch+(Math.random()-.5)*spread;
    let direction=aimDirection(yaw,pitch);if(this.thirdPerson()){const ray=cameraAimRay(this),cameraDir=ray.direction,origin=ray.origin,hit=traceShot(origin,cameraDir,a,this.actors,this.world.map.props,150),eye=this.eye(a);direction=new T.Vector3(origin.x+cameraDir.x*hit.nearest-eye.x,origin.y+cameraDir.y*hit.nearest-eye.y,origin.z+cameraDir.z*hit.nearest-eye.z).normalize();direction.x+=(Math.random()-.5)*spread;direction.y+=(Math.random()-.5)*spread;direction=new T.Vector3(direction.x,direction.y,direction.z).normalize();}this.shoot(a,direction);a.fireTime=Math.max(-.04,a.fireTime)+a.weapon.fireInterval;this.fireBuffer=0;this.recoil=Math.min(.14,this.recoil+.04);this.shotPulse=1;this.viewKick=Math.min(1,this.viewKick+.4);this.shots++;
  }
export function eye(this:Game,a:Actor):Vec3{return {x:a.x,y:a.y+(a.player?this.eyeHeight:a.crouch?1.08:1.6),z:a.z};}
export function shoot(this:Game,a:Actor,dir:Vec3):void{
    if(!a.alive||a.ammo<=0)return;
  a.ammo--;a.protectedTime=0;a.shotAge=0;const origin=this.eye(a),pellets=a.weapon.pellets??1;let registered=false;
  for(let pellet=0;pellet<pellets;pellet++){
    const shotDir=pellets===1?dir:new T.Vector3(dir.x+(Math.random()-.5)*.065,dir.y+(Math.random()-.5)*.065,dir.z+(Math.random()-.5)*.065).normalize();
    const {nearest,target:hitActor,box:hitBox,head,ground}=traceShot(origin,shotDir,a,this.actors,this.world.map.props,pellets>1?a.weapon.range*2:Math.max(120,a.weapon.range*1.2));
    const direction=dir;dir=shotDir;
  const endpoint={x:origin.x+dir.x*nearest,y:origin.y+dir.y*nearest,z:origin.z+dir.z*nearest};
    let muzzle:T.Vector3;if(a.player&&this.thirdPerson()&&this.visuals.get(0)){const visual=this.visuals.get(0)!;visual.root.position.set(a.x,a.y,a.z);visual.root.rotation.y=a.yaw;const weapon=visual.weapon;weapon.rotation.x=a.pitch;visual.root.updateMatrixWorld(true);muzzle=(weapon.userData.muzzle as T.Vector3).clone().applyMatrix4(weapon.matrixWorld);}else if(a.player){this.gun.updateMatrixWorld(true);const local=(this.gun.userData.muzzle as T.Vector3).clone().applyMatrix4(this.gun.matrixWorld),depth=Math.min(.95,Math.max(.08,nearest*.7)),scale=depth/Math.max(.05,-local.z)*Math.tan(T.MathUtils.degToRad(this.camera.fov/2))/Math.tan(T.MathUtils.degToRad(this.gunCamera.fov/2));local.set(local.x*scale,local.y*scale,-depth);this.camera.updateMatrixWorld(true);muzzle=this.camera.localToWorld(local);}else muzzle=new T.Vector3(origin.x+dir.x*.5,origin.y-.25,origin.z+dir.z*.5);this.effects.shot({x:muzzle.x,y:muzzle.y,z:muzzle.z},endpoint,a.player&&!this.thirdPerson(),a.weapon.model??a.weapon.id,a.player?this.collection?.shot:'standard');
    if(hitActor||hitBox||ground)this.effects.impact(endpoint,!!hitActor,hitActor?undefined:hitBox?surfaceNormal(endpoint,hitBox):ground?{x:0,y:1,z:0}:undefined,hitBox?.kind==='container'||hitBox?.kind==='truck');const d=a.player?0:spatialDistance(a,this.player),pan=Math.sin(Math.atan2(a.x-this.player.x,a.z-this.player.z)+this.player.yaw);if(pellet===0)this.audio.shot(a.weapon.id,d,pan);
    if(pellet===0)this.noises.push({x:a.x,y:origin.y,z:a.z,team:a.team,time:this.time,direction:{...dir},length:nearest});if(this.noises.length>70)this.noises.shift();
    if(hitActor&&hitActor.team!==a.team){const falloff=clamp(1-Math.max(0,nearest-a.weapon.range*.45)/(a.weapon.range*1.4),.55,1),amount=a.weapon.damage*falloff*(head?a.weapon.headMultiplier:1);if(hitActor.protectedTime<=0){this.damage(hitActor,amount,a,head);if(a.player){if(!registered){this.hits++;this.awardXP(a.weapon.id,10);registered=true;}this.hitTime=.18;this.headshot=head;if(this.settings?.hitmarkerSound!==false)this.audio.hit(head);}}}
    if(pellet===0&&(a.player||d<18))this.effects.eject({x:muzzle.x,y:origin.y-.2,z:muzzle.z},{x:Math.cos(a.yaw),y:0,z:-Math.sin(a.yaw)});dir=direction;
    }
  }
export function damage(this:Game,target:Actor,amount:number,source:Actor,head=false,kind:'shot'|'grenade'|'melee'='shot'):void{
    if(!target.alive||target.protectedTime>0||!Number.isFinite(amount)||amount<=0)return;this.stats??=freshMatchStats();const applied=Math.min(target.hp,amount);if(source.player&&target.team!==source.team)this.stats.damageDealt+=applied;if(target.player)this.stats.damageTaken+=applied;target.hp=Math.max(0,target.hp-amount);target.lastDamaged=this.time;target.damageFrom.set(source.id,this.time);
    if(target.player){this.damageFlash=.6;this.hooks.event('damage',{yaw:Math.atan2(source.x-target.x,-(source.z-target.z))+target.yaw});this.audio.burst(.16,600,.22);}
    if(target.hp>0)return;target.alive=false;target.deaths++;target.respawnTime=3.5;if(source!==target)source.kills++;scoreElimination(this.score,this.config.mode,source.team,target.team);
    const contributors=[...target.damageFrom].filter(([id,t])=>id!==source.id&&this.time-t<6);for(const [id]of contributors){const ally=this.actors.find(a=>a.id===id);if(ally&&ally.team===source.team){ally.assists++;if(ally.player){this.playerScore+=50;this.hooks.event('assist',{points:50});}}}
    this.hooks.event('kill',{killer:source.name,victim:target.name,team:source.team,player:source.player,head});
    if(source.player&&target!==source&&target.team!==source.team){if(head&&kind==='shot')this.stats.headshotKills++;if(kind==='grenade')this.stats.grenadeKills++;if(kind==='melee')this.stats.meleeKills++;if(this.collection?.kill==='pulse')this.effects.elimination?.({x:target.x,y:target.y+.15,z:target.z});if(kind==='shot')this.awardXP(source.weapon.id,head?160:120,true,head);this.playerScore+=head?150:100;this.streak++;this.bestStreak=Math.max(this.bestStreak,this.streak);this.audio.kill();this.hooks.event('elimination',{name:target.name,points:head?150:100,head,streak:this.streak});}
    if(target.player){this.activeLadder=null;this.climbEntry=null;this.climbExit=null;this.fireBuffer=0;this.jumpBuffer=0;this.streak=0;this.deathBy=source.name;this.mouseDown=false;this.aimDown=false;this.setState('dead');this.hooks.event('death',{name:source.name});if(this.config.mode==='survival'){target.respawnTime=2.5;}}
  }
export function throwGrenade(this:Game,...args:Parameters<typeof ordnance.throwGrenade>):ReturnType<typeof ordnance.throwGrenade>{return ordnance.throwGrenade.apply(this,args);}
export function throwBotGrenade(this:Game,...args:Parameters<typeof ordnance.throwBotGrenade>):ReturnType<typeof ordnance.throwBotGrenade>{return ordnance.throwBotGrenade.apply(this,args);}
export function updateGrenades(this:Game,...args:Parameters<typeof ordnance.updateGrenades>):ReturnType<typeof ordnance.updateGrenades>{return ordnance.updateGrenades.apply(this,args);}
export function melee(this:Game,...args:Parameters<typeof ordnance.melee>):ReturnType<typeof ordnance.melee>{return ordnance.melee.apply(this,args);}
