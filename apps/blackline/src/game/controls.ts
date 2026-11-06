import { aimSensitivity } from '../aim.ts';
import type { TouchAction } from '../input.ts';
import { lookAngles } from '../input.ts';
import { matches,pressed } from '../keybindings.ts';
import { landscapeBlocked } from '../landscape.ts';
import { clamp } from '../math.ts';
import { root } from '../root.ts';
import { JUMP_SPEED } from '../traversal.ts';
export { interactLadder } from './ladder-controller.ts';
import { crosshairEnemy } from './camera.ts';
import { suspendFrame } from './frame-control.ts';

import type { Game } from '../game.ts';
export function listen(this:Game,target:EventTarget,event:string,callback:EventListener,opts?:AddEventListenerOptions):void{target.addEventListener(event,callback,opts);this.callbacks.push(()=>target.removeEventListener(event,callback,opts));}
export function bindInput(this:Game,canvas:HTMLCanvasElement):void{
    this.listen(document,'pointerlockchange',()=>this.pointerLockChanged(document.pointerLockElement===canvas));
    this.listen(document,'pointerlockerror',()=>this.enableFallback());
    this.listen(document,'mousemove',((ev:MouseEvent)=>{if(!this.locked||this.state!=='playing')return;this.lookMouse(ev.movementX,ev.movementY);}) as EventListener);
    this.listen(canvas,'pointerdown',((ev:PointerEvent)=>{if(!this.desktopFallback||this.locked||this.mobile||this.state!=='playing'||this.fallbackPointer!==null||ev.button>2)return;ev.preventDefault();this.fallbackPointer=ev.pointerId;this.fallbackX=ev.clientX;this.fallbackY=ev.clientY;try{canvas.setPointerCapture(ev.pointerId);}catch{}if(ev.button===0){this.mouseDown=true;this.firePlayer();}if(ev.button===2)this.aimDown=this.settings.toggleAim?!this.aimDown:true;}) as EventListener);
    this.listen(canvas,'pointermove',((ev:PointerEvent)=>{if(this.locked||this.state!=='playing'||this.fallbackPointer!==ev.pointerId)return;this.lookMouse(ev.clientX-this.fallbackX,ev.clientY-this.fallbackY);this.fallbackX=ev.clientX;this.fallbackY=ev.clientY;}) as EventListener);
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.listen(canvas,type,((ev:PointerEvent)=>{if(this.fallbackPointer!==ev.pointerId)return;this.fallbackPointer=null;this.mouseDown=false;if(ev.type==='pointercancel'||!this.settings.toggleAim)this.aimDown=false;}) as EventListener);
    this.listen(document,'mousedown',((ev:MouseEvent)=>{if(this.state!=='playing'||!this.locked)return;if(ev.button===0){this.mouseDown=true;this.firePlayer();}if(ev.button===2)this.aimDown=this.settings.toggleAim?!this.aimDown:true;}) as EventListener);
    this.listen(document,'mouseup',((ev:MouseEvent)=>{if(ev.button===0){this.mouseDown=false;}if(ev.button===2&&!this.settings.toggleAim)this.aimDown=false;}) as EventListener);
    this.listen(canvas,'contextmenu',ev=>ev.preventDefault());
    this.listen(document,'keydown',((ev:KeyboardEvent)=>{
      if(ev.target instanceof HTMLInputElement||ev.target instanceof HTMLSelectElement)return;
      if(this.state==='playing'||this.state==='dead'){
        const binds=this.settings.bindings;if(ev.code==='Escape'||Object.values(binds??{}).some(c=>c.includes(ev.code))||matches(ev.code,'jump',binds)||matches(ev.code,'score',binds))ev.preventDefault();this.keys.add(ev.code);if(ev.repeat)return;
        if(ev.code==='Escape'||matches(ev.code,'pause',binds))this.pause();if(this.state!=='playing')return;
        if(matches(ev.code,'interact',binds))this.interactLadder();if(matches(ev.code,'reload',binds))this.reloadPlayer();if(matches(ev.code,'grenade',binds))this.throwGrenade();if(matches(ev.code,'melee',binds))this.melee();
        if(matches(ev.code,'jump',binds))this.jumpPlayer();if(matches(ev.code,'crouch',binds)&&pressed(this.keys,'sprint',binds))this.slidePlayer();
        for(let i=0;i<5;i++)if(matches(ev.code,('weapon'+(i+1)) as 'weapon1',binds))this.selectSlot(i);
        if(matches(ev.code,'view',binds))toggleView.call(this);if(matches(ev.code,'heal',binds))this.useMedkit();
        if(matches(ev.code,'fullscreen',binds))this.fullscreen();
      }
    }) as EventListener);
    this.listen(document,'keyup',((ev:KeyboardEvent)=>{this.keys.delete(ev.code);}) as EventListener);
    this.listen(window,'blur',()=>{if(this.state==='playing'||this.state==='dead')this.pause();});
    this.listen(document,'visibilitychange',()=>{if(document.hidden){if(this.state==='playing'||this.state==='dead')this.pause();suspendFrame.call(this);}else {this.lastFrame=performance.now();this.fpsTime=0;this.frames=0;this.invalidate();}});
    this.listen(window,'resize',()=>this.resize());
    if(window.visualViewport)this.listen(window.visualViewport,'resize',()=>this.resize());
    this.listen(window,'orientationchange',()=>{this.touch.reset();this.resize();if(this.state==='playing'||this.state==='dead')this.pause();});
    this.listen(canvas,'webglcontextlost',ev=>{ev.preventDefault();this.pause();this.hooks.event('notice',{text:'Le contexte graphique a été perdu. Rechargez le Site pour reprendre.'});});
  }
export function lookMouse(this:Game,dx:number,dy:number):void{const scale=aimSensitivity(this.camera.fov,this.settings.fov)*(this.aimDown?(this.settings.adsSensitivity??1):1);this.mouseX=dx;this.mouseY=dy;this.player.yaw-=dx*.002*this.settings.sensitivity*scale;this.player.pitch=clamp(this.player.pitch-dy*.002*this.settings.sensitivity*scale*(this.settings.invertY?-1:1),-1.48,1.48);}
export function pointerLockChanged(this:Game,locked:boolean):void{
    const wasLocked=this.locked;this.locked=locked;if(this.mobile)return;
    if(locked&&this.state!=='playing'&&this.state!=='dead'){this.locked=false;if(typeof document!=='undefined')document.exitPointerLock?.();return;}
    if(locked){this.desktopFallback=false;this.fallbackPointer=null;this.lastFrame=performance.now();}
    else if(wasLocked&&(this.state==='playing'||this.state==='dead'))this.pause(false);
  }
export function enableFallback(this:Game):void{
    if(this.mobile||this.locked||!(this.state==='playing'||this.state==='dead'))return;
    this.desktopFallback=true;
    if(!this.fallbackNotified){this.fallbackNotified=true;this.hooks.event('notice',{text:'La partie continue sans capture de souris. Maintenez le clic droit et glissez pour regarder et viser ; clic gauche pour tirer.'});}
  }
export function lockMouse(this:Game):void{
    if(this.mobile)return;if(this.locked)return;this.desktopFallback=true;
    try{const result=this.renderer.domElement.requestPointerLock();if(result&&typeof result.catch==='function')result.catch(()=>this.enableFallback());}
    catch{this.enableFallback();}
  }
export function pause(this:Game,unlock=true):void{if(this.state==='menu'||this.state==='ending')return;this.keys.clear();this.mouseDown=false;this.aimDown=false;this.jumpBuffer=0;this.fireBuffer=0;this.fallbackPointer=null;this.setState('paused');if(unlock&&this.locked)document.exitPointerLock();}
export function resume(this:Game):void{if(this.state!=='paused'||landscapeBlocked(this.mobile))return;this.touch.reset();this.lastFrame=performance.now();this.setState(this.player.alive?'playing':'dead');try{this.audio.init();}catch{this.hooks.event('notice',{text:'Audio indisponible : la partie continue sans son.'});}if(!this.mobile)this.lockMouse();}
export function menu(this:Game):void{this.setState('menu');if(this.locked)document.exitPointerLock();this.clearActors();this.world.setObjectivesVisible(false);this.keys.clear();this.mouseDown=false;this.aimDown=false;this.camera.fov=this.settings.fov;this.camera.updateProjectionMatrix();}
export function fullscreen(this:Game):void{if(document.fullscreenElement)void document.exitFullscreen();else if(typeof root().requestFullscreen==='function')void root().requestFullscreen().catch(()=>this.hooks.event('notice',{text:'Le plein écran est indisponible dans cet affichage.'}));else this.hooks.event('notice',{text:'Le plein écran n’est pas disponible dans ce navigateur. Le jeu reste accessible en paysage.'});}
export function lookTouch(this:Game,dx:number,dy:number):void{if(this.state!=='playing')return;const assist=this.settings.mobileAimAssist!==false&&crosshairEnemy.call(this,.15)? .6:1;const aim=aimSensitivity(this.camera.fov,this.settings.fov)*assist*(this.aimDown?(this.settings.adsSensitivity??1):1),angles=lookAngles(this.player.yaw,this.player.pitch,dx,dy,this.settings.touchSensitivity,this.settings.invertY,aim);this.player.yaw=angles.yaw;this.player.pitch=angles.pitch;this.mouseX=dx;this.mouseY=dy;}
export function touchAction(this:Game,action:TouchAction):void{
    if(action==='pause'){this.pause();return;}if(action==='score'&&(this.state==='playing'||this.state==='dead')){this.touch.scoreboard=!this.touch.scoreboard;return;}if(this.state!=='playing'||!this.player.alive)return;
    if(action==='fire')this.firePlayer();if(action==='aim'){this.touch.aim=!this.touch.aim;this.aimDown=this.touch.aim;}
    if(action==='interact')this.interactLadder();if(action==='jump')this.jumpPlayer();if(action==='crouch'){if(!this.slidePlayer())this.touch.crouch=!this.touch.crouch;}
    if(action==='sprint'){this.touch.sprint=!this.touch.sprint;this.touch.crouch=false;}
    if(action==='reload')this.reloadPlayer();if(action==='grenade')this.throwGrenade();if(action==='melee')this.melee();
    if(action==='view')toggleView.call(this);if(action==='heal')this.useMedkit();if(action.startsWith('weapon-'))this.selectSlot(Number(action.slice(-1))-1);
  }
export function jumpPlayer(this:Game):void{
    if(this.state!=='playing'||!this.player.alive)return;this.jumpBuffer=.14;
    if(this.climbExit){this.player.x=this.climbExit.exit.x;this.player.z=this.climbExit.exit.z;this.climbExit=null;this.grounded=true;}if(this.activeLadder){this.player.x=this.activeLadder.x;this.player.z=this.activeLadder.z+.08;this.activeLadder=null;this.climbEntry=null;this.grounded=true;}
    if(this.grounded||(this.coyoteTime??0)>0){this.velocityY=JUMP_SPEED;this.grounded=false;this.coyoteTime=0;this.jumpBuffer=0;this.slideTime=0;this.touch.crouch=false;this.audio.burst(.09,900,.08);}
  }
export function slidePlayer(this:Game):boolean{const speed=Math.hypot(this.player.vx,this.player.vz);if(this.state!=='playing'||this.activeLadder||this.climbExit||!this.player.alive||speed<=5||this.slideCooldown>0)return false;this.slideTime=.7;this.slideCooldown=1.5;this.touch.crouch=false;this.slideDir={x:this.player.vx/speed,z:this.player.vz/speed};this.audio.burst(.35,1100,.18);return true;}

function toggleView(this:Game){this.settings.cameraMode=this.settings.cameraMode==='third'?'first':'third';this.aimDown=false;this.touch.aim=false;this.hooks.event('view',{mode:this.settings.cameraMode});}
