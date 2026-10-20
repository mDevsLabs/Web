import * as T from 'three';
import { outdoorEnvironment } from './render/lighting.ts';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { normalizeCareer,type Career } from '../lib/game/career.js';
import type { Collection } from '../lib/game/shop-catalog.js';
import { normalizeCollection } from '../lib/game/shop-catalog.js';
import type { Actor,Noise } from './ai.ts';
import { BotBrain,createActor } from './ai.ts';
import { GameAudio } from './audio.ts';
import { Effects } from './effects.ts';
import { SupplyVisuals } from './equipment.ts';
import type { CameraRig } from './game/camera.ts';
import { thirdPerson } from './game/camera.ts';
import * as combat from './game/combat.ts';
import type { GameHooks,GameState } from './game/contracts.ts';
import * as controls from './game/controls.ts';
import { invalidateFrame } from './game/frame-control.ts';
import { FramePacer } from './game/frame-pacer.ts';
import * as match from './game/match.ts';
import * as player from './game/player.ts';
import { warmup } from './game/preparation.ts';
import * as render_settings from './game/render-settings.ts';
import { renderFrame } from './game/runtime.ts';
import * as snapshot from './game/snapshot.ts';
import {freshMatchStats} from './match-stats.ts';
import { TouchInput,isTouchDevice } from './input.ts';
import { createMap } from './maps.ts';
import type { Supply } from './mission.ts';
import { Navigation } from './navigation.ts';
import { aimFov } from './optics.ts';
import type { ProgressBook } from './progression.ts';
import { awardWeaponXP,normalizeProgress } from './progression.ts';
import { UltraBloomPass } from './render/ultra-bloom.ts';
import type { RenderLimits } from './graphics-policy.ts';
import { ultraOutputShader } from './render/ultra-output.ts';
import type { SquadOrder } from './squad.ts';
import type { Ladder } from './traversal.ts';
import { COYOTE_TIME } from './traversal.ts';
import type { MatchConfig,Objective,Settings } from './types.ts';
import { WEAPONS } from './types.ts';
import type { SoldierVisual } from './world.ts';
import { World,createWeapon } from './world.ts';

export type { GameHooks,GameState,HUDData } from './game/contracts.ts';
type Grenade={mesh:T.Group;velocity:T.Vector3;age:number;owner:Actor;};
const NAMES=['GHOST','NOVA','REAPER','ECHO','VIPER','ATLAS','BISHOP','ROOK','HAVOC','SPECTRE','FROST','RAVEN','HUNTER','JAEGER','ORION','COBRA','ONYX','TALON','VENOM','WOLF'];


export class Game {
  scene=new T.Scene();camera=new T.PerspectiveCamera(84,1,.055,600);renderer:T.WebGLRenderer;
  composer:EffectComposer;bloom:UnrealBloomPass;fxaa:ShaderPass;film:ShaderPass;
  gunScene=new T.Scene();gunCamera=new T.PerspectiveCamera(64,1,.02,8);gun:T.Group;
  world:World;nav:Navigation;effects:Effects;audio=new GameAudio();state:GameState='menu';settings:Settings;
  config:MatchConfig={mode:'tdm',map:'harbor',difficulty:'regular',bots:7,weapon:'ar',duration:300};
  actors:Actor[]=[];brains:BotBrain[]=[];visuals=new Map<number,SoldierVisual>();player:Actor;
  objectives:Objective[]=[];noises:Noise[]=[];score:[number,number]=[0,0];grenades:Grenade[]=[];grenadeCount=2;
  career:Career=normalizeCareer({});medkitCount=0;
  inventory=new Map<string,{ammo:number;reserve:number}>();
  keys=new Set<string>();mouseDown=false;aimDown=false;locked=false;time=0;matchTime=0;menuTime=0;
  preparing=true;pacer=new FramePacer();renderDirty=true;frameRequest:number|undefined;cameraRig:CameraRig|undefined;
  suspended=false;frameTimer:ReturnType<typeof setTimeout>|undefined;
  renderLimits:RenderLimits|undefined;lastShadowFrame=0;lastFrame=0;fps=60;frames=0;fpsTime=0;hudTime=0;resolution='';baseRatio=1;adaptiveScale=1;slowTime=0;
  velocityY=0;grounded=true;eyeHeight=1.63;walkTime=0;stepTime=0;recoil=0;hitTime=0;headshot=false;damageFlash=0;
  aimAmount=0;slideTime=0;slideCooldown=0;slideDir={x:0,z:0};wave=1;waveNext=0;streak=0;bestStreak=0;
  intel:[Map<number,{position:{x:number;z:number};time:number}>,Map<number,{position:{x:number;z:number};time:number}>]=[new Map(),new Map()];
  stats=freshMatchStats();shots=0;hits=0;playerScore=0;deathBy='';scoreTick=0;respawns=0;mouseX=0;mouseY=0;disposed=false;
  callbacks:(()=>void)[]=[];
  shotPulse=0;viewKick=0;reloadStage=0;
  supplies:Supply[]=[];supplyVisuals:SupplyVisuals|null=null;orders=new Map<number,SquadOrder>();nextSquad=0;pointIndex=-1;holdTime=0;
  collection:Collection=normalizeCollection({});
  progress:ProgressBook=normalizeProgress({});weaponXP:Record<string,number>={};gunCache=new Map<string,T.Group>();
  touch=new TouchInput();
  desktopFallback=false;fallbackPointer:number|null=null;fallbackX=0;fallbackY=0;fallbackNotified=false;
  climbExit:Ladder|null=null;climbExitProgress=0;
  ladderDirection:1|-1=1;ladderPaused=false;ladderInputArmed=true;climbEntry:{x:number;z:number;progress:number}|null=null;activeLadder:Ladder|null=null;coyoteTime=COYOTE_TIME;jumpBuffer=0;fireBuffer=0;
  constructor(canvas:HTMLCanvasElement,settings:Settings,readonly hooks:GameHooks,readonly mobile=isTouchDevice()){
    this.settings=settings;this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',alpha:false});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
    const gl=this.renderer.getContext(),viewport=gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;this.renderLimits={maxTextureSize:this.renderer.capabilities.maxTextureSize,maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maxViewportWidth:viewport[0],maxViewportHeight:viewport[1]};
    const env=outdoorEnvironment(this.renderer);this.scene.environment=env.texture;this.scene.environmentIntensity=.85;
    this.world=new World(this.scene,createMap('harbor'),this.mobile);this.nav=new Navigation(this.world.map.width,this.world.map.depth,this.world.map.props);this.effects=new Effects(this.scene,this.mobile?140:240);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UltraBloomPass(new T.Vector2(1,1),.16,.62,1.08);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.fxaa=new ShaderPass(ultraOutputShader);this.film=this.fxaa;this.composer.addPass(this.fxaa);
    this.gun=createWeapon(WEAPONS[0],true);this.gunScene.environment=this.scene.environment;this.gunScene.add(this.gun);this.gunScene.add(new T.HemisphereLight(0xc4d9de,0x5e6e59,2.8));const keyLight=new T.DirectionalLight(0xffdfad,3.5);keyLight.position.set(-2,3,-2);this.gunScene.add(keyLight);const rimLight=new T.DirectionalLight(0x91c9eb,1.4);rimLight.position.set(3,1,2);this.gunScene.add(rimLight);
    this.player=createActor(0,settings.callsign,0,WEAPONS[0],true);this.bindInput(canvas);this.applySettings(settings);this.world.setObjectivesVisible(false);
    this.lastFrame=performance.now();this.invalidate();
  }
  async warmup(...args:Parameters<typeof warmup>){this.preparing=true;try{return await warmup.apply(this,args);}finally{this.preparing=false;this.lastFrame=performance.now();this.invalidate();}}
  listen(...args:Parameters<typeof controls.listen>):ReturnType<typeof controls.listen>{return controls.listen.apply(this,args);}
  bindInput(...args:Parameters<typeof controls.bindInput>):ReturnType<typeof controls.bindInput>{return controls.bindInput.apply(this,args);}
  invalidate(){invalidateFrame.call(this);}
  setState(state:GameState){const waking=(state==='playing'||state==='dead')&&this.state!=='playing'&&this.state!=='dead';this.state=state;if(state!=='playing')this.touch.reset();this.hooks.state(state);if(waking){this.lastFrame=performance.now();this.fpsTime=0;this.frames=0;}this.invalidate();}
  applySettings(...args:Parameters<typeof render_settings.applySettings>):ReturnType<typeof render_settings.applySettings>{render_settings.applySettings.apply(this,args);this.invalidate();}
  resize(...args:Parameters<typeof render_settings.resize>):ReturnType<typeof render_settings.resize>{render_settings.resize.apply(this,args);this.invalidate();}
  setMap(...args:Parameters<typeof match.setMap>):ReturnType<typeof match.setMap>{return match.setMap.apply(this,args);}
  menuMap(...args:Parameters<typeof match.menuMap>):ReturnType<typeof match.menuMap>{return match.menuMap.apply(this,args);}
  clearActors(...args:Parameters<typeof match.clearActors>):ReturnType<typeof match.clearActors>{return match.clearActors.apply(this,args);}
  start(...args:Parameters<typeof match.start>):ReturnType<typeof match.start>{return match.start.apply(this,args);}
  addBot(...args:Parameters<typeof match.addBot>):ReturnType<typeof match.addBot>{return match.addBot.apply(this,args);}
  spawn(...args:Parameters<typeof match.spawn>):ReturnType<typeof match.spawn>{return match.spawn.apply(this,args);}
  spawnWave(...args:Parameters<typeof match.spawnWave>):ReturnType<typeof match.spawnWave>{return match.spawnWave.apply(this,args);}
  lookMouse(...args:Parameters<typeof controls.lookMouse>):ReturnType<typeof controls.lookMouse>{return controls.lookMouse.apply(this,args);}
  pointerLockChanged(...args:Parameters<typeof controls.pointerLockChanged>):ReturnType<typeof controls.pointerLockChanged>{return controls.pointerLockChanged.apply(this,args);}
  enableFallback(...args:Parameters<typeof controls.enableFallback>):ReturnType<typeof controls.enableFallback>{return controls.enableFallback.apply(this,args);}
  lockMouse(...args:Parameters<typeof controls.lockMouse>):ReturnType<typeof controls.lockMouse>{return controls.lockMouse.apply(this,args);}
  pause(...args:Parameters<typeof controls.pause>):ReturnType<typeof controls.pause>{return controls.pause.apply(this,args);}
  resume(...args:Parameters<typeof controls.resume>):ReturnType<typeof controls.resume>{return controls.resume.apply(this,args);}
  menu(...args:Parameters<typeof controls.menu>):ReturnType<typeof controls.menu>{return controls.menu.apply(this,args);}
  fullscreen(...args:Parameters<typeof controls.fullscreen>):ReturnType<typeof controls.fullscreen>{return controls.fullscreen.apply(this,args);}
  lookTouch(...args:Parameters<typeof controls.lookTouch>):ReturnType<typeof controls.lookTouch>{return controls.lookTouch.apply(this,args);}
  touchAction(...args:Parameters<typeof controls.touchAction>):ReturnType<typeof controls.touchAction>{return controls.touchAction.apply(this,args);}
  interactLadder(...args:Parameters<typeof controls.interactLadder>):ReturnType<typeof controls.interactLadder>{return controls.interactLadder.apply(this,args);}
  jumpPlayer(...args:Parameters<typeof controls.jumpPlayer>):ReturnType<typeof controls.jumpPlayer>{return controls.jumpPlayer.apply(this,args);}
  slidePlayer(...args:Parameters<typeof controls.slidePlayer>):ReturnType<typeof controls.slidePlayer>{return controls.slidePlayer.apply(this,args);}
  thirdPerson(){return thirdPerson.call(this);}
  selectSlot(index:number){this.career??=normalizeCareer({});const id=this.career.loadout[index];if(id==='medkit')this.useMedkit();else if(id==='grenade')this.throwGrenade();else if(id)this.switchWeapon(id);}
  useMedkit(){if(this.state!=='playing'||!this.player.alive||this.medkitCount<1||this.player.hp>=100||this.activeLadder)return;this.medkitCount--;const before=this.player.hp;this.player.hp=Math.min(100,this.player.hp+60);this.stats??=freshMatchStats();this.stats.healing+=this.player.hp-before;this.hooks.event('notice',{text:'Paquet de soins utilisé · +60 HP'});this.audio.tone(740,.2,'triangle',.1);}
  switchWeapon(...args:Parameters<typeof combat.switchWeapon>):ReturnType<typeof combat.switchWeapon>{return combat.switchWeapon.apply(this,args);}
  reloadPlayer(...args:Parameters<typeof combat.reloadPlayer>):ReturnType<typeof combat.reloadPlayer>{return combat.reloadPlayer.apply(this,args);}
  firePlayer(...args:Parameters<typeof combat.firePlayer>):ReturnType<typeof combat.firePlayer>{return combat.firePlayer.apply(this,args);}
  eye(...args:Parameters<typeof combat.eye>):ReturnType<typeof combat.eye>{return combat.eye.apply(this,args);}
  shoot(...args:Parameters<typeof combat.shoot>):ReturnType<typeof combat.shoot>{return combat.shoot.apply(this,args);}
  damage(...args:Parameters<typeof combat.damage>):ReturnType<typeof combat.damage>{return combat.damage.apply(this,args);}
  throwGrenade(...args:Parameters<typeof combat.throwGrenade>):ReturnType<typeof combat.throwGrenade>{return combat.throwGrenade.apply(this,args);}
  throwBotGrenade(...args:Parameters<typeof combat.throwBotGrenade>):ReturnType<typeof combat.throwBotGrenade>{return combat.throwBotGrenade.apply(this,args);}
  melee(...args:Parameters<typeof combat.melee>):ReturnType<typeof combat.melee>{return combat.melee.apply(this,args);}
  updatePlayer(...args:Parameters<typeof player.updatePlayer>):ReturnType<typeof player.updatePlayer>{return player.updatePlayer.apply(this,args);}
  stamina=100;
  updateGrenades(...args:Parameters<typeof combat.updateGrenades>):ReturnType<typeof combat.updateGrenades>{return combat.updateGrenades.apply(this,args);}
  updateModes(...args:Parameters<typeof match.updateModes>):ReturnType<typeof match.updateModes>{return match.updateModes.apply(this,args);}
  updateVisuals(...args:Parameters<typeof match.updateVisuals>):ReturnType<typeof match.updateVisuals>{return match.updateVisuals.apply(this,args);}
  updateSupplies(...args:Parameters<typeof match.updateSupplies>):ReturnType<typeof match.updateSupplies>{return match.updateSupplies.apply(this,args);}
  finish(...args:Parameters<typeof match.finish>):ReturnType<typeof match.finish>{return match.finish.apply(this,args);}
  aimFov(){return aimFov(this.player.weapon,this.settings.fov,this.settings.adsZoom??1);}
  awardXP(id:string,xp:number,kill=false,head=false){if(!this.progress)return;const result=awardWeaponXP(this.progress,id,xp,kill,head);this.weaponXP??={};this.weaponXP[id]=(this.weaponXP[id]??0)+xp;this.hooks.event('weapon-xp',{id,level:result.level,leveled:result.leveled});}
  scoped(){return this.aimDown&&!this.activeLadder&&!this.climbExit&&this.aimAmount>.96&&this.player.reloadTime<=0&&Math.abs(this.camera.fov-this.aimFov())<3;}
  snapshot(...args:Parameters<typeof snapshot.snapshot>):ReturnType<typeof snapshot.snapshot>{return snapshot.snapshot.apply(this,args);}
  frame=(now:number)=>renderFrame.call(this,now);
}
