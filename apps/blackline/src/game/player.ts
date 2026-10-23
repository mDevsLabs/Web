import { moveCharacter } from '../character-physics.ts';
import { reloadProgress } from '../combat-motion.ts';
import { movementVector } from '../input.ts';
import { pressed } from '../keybindings.ts';
import { circleBlocked,clamp,damp } from '../math.ts';
import { opticY } from '../optics.ts';
import { COYOTE_TIME,verticalStep } from '../traversal.ts';
import { animateWeaponParts } from '../viewmodel.ts';
import { updateLadder } from './ladder-controller.ts';
import { crosshairEnemy,positionCamera } from './camera.ts';

import type { Game } from '../game.ts';
export function updatePlayer(this:Game,dt:number):void{
    const a=this.player;a.shotAge+=dt;if(this.mobile)this.aimDown=this.touch.aim;a.protectedTime=Math.max(0,a.protectedTime-dt);a.fireTime=(this.mouseDown&&a.weapon.automatic)||this.touch.firing||(this.fireBuffer??0)>0?Math.max(-dt,a.fireTime-dt):Math.max(0,a.fireTime-dt);this.fireBuffer=Math.max(0,(this.fireBuffer??0)-dt);this.jumpBuffer=Math.max(0,(this.jumpBuffer??0)-dt);this.coyoteTime=this.grounded?COYOTE_TIME:Math.max(0,(this.coyoteTime??0)-dt);this.slideTime=Math.max(0,this.slideTime-dt);this.slideCooldown=Math.max(0,this.slideCooldown-dt);
    if(!a.alive){a.respawnTime-=dt;if(a.respawnTime<=0){if(this.config.mode==='survival')this.finish(false);else {this.spawn(a);this.setState('playing');this.respawns++;this.hooks.event('respawn',{});}}return;}
    if(a.reloadTime>0){a.reloadTime=Math.max(0,a.reloadTime-dt);const progress=reloadProgress(a.reloadTime,a.weapon.reload),stage=progress>.88?3:progress>.66?2:progress>.23?1:0;if(stage>this.reloadStage){this.reloadStage=stage;this.audio.reloadStep(stage);}if(a.reloadTime===0){const n=Math.min(a.weapon.mag-a.ammo,a.reserve);a.ammo+=n;a.reserve-=n;}}
    const binds=this.settings.bindings,forward=clamp((pressed(this.keys,'forward',binds)?1:0)-(pressed(this.keys,'back',binds)?1:0)+this.touch.forward,-1,1),side=clamp((pressed(this.keys,'right',binds)?1:0)-(pressed(this.keys,'left',binds)?1:0)+this.touch.side,-1,1);
    a.crouch=!this.activeLadder&&(pressed(this.keys,'crouch',binds)||this.touch.crouch||this.slideTime>0);
    if(!a.crouch&&!this.activeLadder&&!this.climbExit&&circleBlocked(a,.35,this.world.map.props,a.y,1.63))a.crouch=true;
    const sprint=(pressed(this.keys,'sprint',binds)||this.touch.sprint||(this.mobile&&this.settings.autoSprint&&this.touch.forward>.85))&&forward>0&&!this.activeLadder&&!this.climbExit&&!a.crouch&&!this.aimDown&&this.stamina>5,speed=(a.crouch?2.5:sprint?7.8:this.aimDown?3.1:4.8)*a.weapon.mobility;
    this.stamina=clamp(this.stamina+(sprint?-20:16)*dt,0,100);
    const movement=movementVector(a.yaw,forward,side);let dx=movement.x*speed,dz=movement.z*speed;
    if(this.slideTime>0){dx=this.slideDir.x*(5+this.slideTime*7);dz=this.slideDir.z*(5+this.slideTime*7);}
    const ox=a.x,oz=a.z;
    if(!updateLadder.call(this,forward,dt)){
      const moved=moveCharacter(a,dx*dt,dz*dt,.36,this.world.map.props,this.world.map.width,this.world.map.depth,a.crouch?1.02:1.63,this.grounded);a.x=moved.x;a.y=moved.y;a.z=moved.z;
      const vertical=verticalStep(a,this.velocityY,this.grounded,dt,this.world.map.props,a.crouch?1.02:1.63);a.y=vertical.y;this.velocityY=vertical.velocity;this.grounded=vertical.grounded;
      if(this.grounded&&this.jumpBuffer>0)this.jumpPlayer();
    }
    a.vx=(a.x-ox)/dt;a.vz=(a.z-oz)/dt;
    this.eyeHeight=damp(this.eyeHeight,a.crouch?1.02:1.63,14,dt);const moving=Math.hypot(a.vx,a.vz)>1;this.walkTime+=dt*(sprint?12:8);this.stepTime+=dt;if(moving&&this.grounded&&this.stepTime>(sprint?.31:.48)){this.audio.footstep(sprint);this.stepTime=0;if(!a.crouch){this.noises.push({x:a.x,y:a.y+.2,z:a.z,team:a.team,time:this.time,kind:'step',radius:sprint?17:10});if(this.noises.length>80)this.noises.shift();}}
    const aiming=this.aimDown&&a.reloadTime<=0&&!this.activeLadder&&!this.climbExit;this.aimAmount=damp(this.aimAmount,aiming?1:0,15,dt);this.camera.fov=damp(this.camera.fov,aiming?this.aimFov():this.settings.fov+(sprint?7:0),12,dt);this.camera.updateProjectionMatrix();
    this.shotPulse=Math.max(0,this.shotPulse-dt*14);this.viewKick=damp(this.viewKick,0,17,dt);
    const bob=(this.settings.cameraShake&&!this.settings.reduceMotion)&&moving&&this.grounded&&!aiming?Math.sin(this.walkTime)*(sprint?.035:.018):0,kick=(this.settings.cameraShake&&!this.settings.reduceMotion)?this.viewKick*.009:0;
    this.camera.position.set(a.x,a.y+this.eyeHeight+bob,a.z);this.camera.rotation.order='YXZ';this.camera.rotation.set(a.pitch+kick*(aiming?.15:1),a.yaw,(this.settings.cameraShake&&!this.settings.reduceMotion)?(this.slideTime>0?.025:Math.sin(this.walkTime*.5)*bob*.12):0);
    positionCamera.call(this,dt);
    const progress=reloadProgress(a.reloadTime,a.weapon.reload),pose=animateWeaponParts(this.gun,progress,this.shotPulse);this.recoil=damp(this.recoil,0,16,dt);
    this.gun.position.set(damp(this.gun.position.x,.255*(1-this.aimAmount)+pose.roll*.12,15,dt),-.24*(1-this.aimAmount)-opticY(a.weapon)*this.aimAmount+this.recoil*.18+(this.settings.cameraShake&&!this.settings.reduceMotion&&moving&&!aiming?Math.sin(this.walkTime)*.008:0)-pose.drop,(a.weapon.id==='dmr'?-.40:a.weapon.id==='pistol'?-.43:-.40)*this.aimAmount-.54*(1-this.aimAmount)+this.recoil*.25);
    this.gun.rotation.set(-this.recoil*(aiming?.2:.8)+pose.pitch,0,-.04*(1-this.aimAmount)+pose.roll+damp(0,this.mouseX*.0005*(1-this.aimAmount),10,dt));this.gun.visible=!this.thirdPerson();this.gunCamera.fov=64-this.aimAmount*10;this.gunCamera.updateProjectionMatrix();this.mouseX*=.8;this.mouseY*=.8;
    const auto=this.mobile&&this.settings.mobileAutoFire!==false&&!this.activeLadder&&!this.climbExit&&!!crosshairEnemy.call(this);if((this.mouseDown&&a.weapon.automatic)||this.touch.firing||this.fireBuffer>0||auto)this.firePlayer(false);if(a.hp<100&&this.time-a.lastDamaged>5.2)a.hp=Math.min(100,a.hp+dt*16);
  }
