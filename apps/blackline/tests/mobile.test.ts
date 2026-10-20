import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { TouchInput, joystick, lookAngles, movementVector, renderBudget, touchDevice } from '../src/input.ts';
import { TouchControls } from '../src/touch-controls.ts';
import { Game } from '../src/game.ts';
import { createActor } from '../src/ai.ts';
import { createMap } from '../src/maps.ts';
import { DEFAULT_SETTINGS, WEAPONS } from '../src/types.ts';
import { loadSettings } from '../src/storage.ts';
import { Navigation } from '../src/navigation.ts';

function withGlobal(name:string,value:unknown,run:()=>void){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  try{run();}finally{if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete (globalThis as any)[name];}
}
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≈ ${b}`);

test('le joystick applique une zone morte, conserve le sens et borne les diagonales',()=>{
  assert.deepEqual(joystick(1,-1),{side:0,forward:0});
  near(joystick(0,-48).forward,1);near(joystick(48,0).side,1);near(joystick(0,48).forward,-1);
  const diagonal=joystick(300,-300);near(Math.hypot(diagonal.side,diagonal.forward),1);
  assert.ok(joystick(0,-24).forward>0&&joystick(0,-24).forward<.5);
  const forward=movementVector(0,1,0);near(forward.x,0);near(forward.z,-1);
  const turned=movementVector(-Math.PI/2,1,0);near(turned.x,1);near(turned.z,0);
  near(Math.hypot(...Object.values(movementVector(1.4,1,1))),1);
  near(Math.hypot(...Object.values(movementVector(0,.3,0))),.3);
});
test('la visée suit le doigt, respecte l’inversion, le zoom et les limites verticales',()=>{
  const rightUp=lookAngles(0,0,20,-20,1,false);assert.ok(rightUp.yaw<0&&rightUp.pitch>0);
  near(lookAngles(0,0,20,20,1,true).pitch,rightUp.pitch);
  near(lookAngles(0,0,20,-20,1,false,.5).yaw,rightUp.yaw*.5);
  near(lookAngles(0,0,20,-20,2,false).yaw,rightUp.yaw*2);
  assert.equal(lookAngles(0,1.4,0,-100,3,false).pitch,1.48);
  assert.equal(lookAngles(0,-1.4,0,100,3,false).pitch,-1.48);
  near(lookAngles(0,0,5000,0,1,false).yaw,lookAngles(0,0,100,0,1,false).yaw);
});
test('trois doigts déplacent, regardent et tirent sans partager leur état',()=>{
  const input=new TouchInput();
  assert.equal(input.begin(1,'move',{x:50,y:50}),true);input.update(1,{x:50,y:2});
  input.begin(2,'look',{x:250,y:200});input.begin(3,'fire',{x:350,y:280});
  assert.equal(input.firing,true);near(input.forward,1);
  assert.deepEqual(input.update(2,{x:270,y:190}),{x:20,y:-10});
  assert.deepEqual(input.update(3,{x:355,y:290}),{x:5,y:10});near(input.forward,1);
  assert.equal(input.begin(4,'move',{x:0,y:0}),false);
  assert.equal(input.begin(3,'look',{x:0,y:0}),false);
  input.release(2);assert.equal(input.firing,true);near(input.forward,1);
  input.release(1);assert.equal(input.forward,0);assert.equal(input.firing,true);
  input.begin(5,'fire',{x:350,y:280});input.release(3);assert.equal(input.firing,true);
  input.release(5);assert.equal(input.firing,false);
});
test('un retour au menu ne conserve aucun doigt ni bouton bascule',()=>{
  const input=new TouchInput();input.begin(1,'move',{x:0,y:-48},{x:0,y:0});input.begin(2,'fire',{x:0,y:0});
  input.aim=input.crouch=input.sprint=input.scoreboard=true;input.reset();
  assert.equal(input.pointers.size,0);assert.equal(input.moveId,null);
  for(const value of [input.side,input.forward,input.aim,input.crouch,input.sprint,input.scoreboard,input.firing])assert.equal(Boolean(value),false);
});

class FakeElement extends EventTarget {
  dataset:Record<string,string>={};style:Record<string,string>={};attributes=new Map<string,string>();held=new Set<number>();classes=new Set<string>();children:FakeElement[]=[];
  classList={add:(name:string)=>this.classes.add(name),remove:(name:string)=>this.classes.delete(name),toggle:(name:string,on:boolean)=>on?this.classes.add(name):this.classes.delete(name)};
  constructor(kind=''){super();if(kind)this.dataset.touch=kind;}
  getBoundingClientRect(){return {left:0,top:0,width:this.dataset.touch==='move'?110:50,height:this.dataset.touch==='move'?110:50};}
  querySelectorAll(){return this.children.filter(e=>e.dataset.touch);}
  querySelector(selector:string){return selector==='.joystick-knob'?this.children.find(e=>e.classes.has('joystick-knob')):this.children.find(e=>`[data-touch="${e.dataset.touch}"]`===selector);}
  setPointerCapture(id:number){this.held.add(id);}
  hasPointerCapture(id:number){return this.held.has(id);}
  releasePointerCapture(id:number){this.held.delete(id);this.dispatchEvent(pointer('lostpointercapture',id));}
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
}
function pointer(type:string,id:number,x=0,y=0){
  const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0});return event;
}
test('les événements de capture, d’annulation et de rotation libèrent les bonnes commandes',()=>{
  withGlobal('window',new EventTarget(),()=>{
    const root=new FakeElement(),move=new FakeElement('move'),fire=new FakeElement('fire'),look=new FakeElement('look'),pause=new FakeElement('pause'),knob=new FakeElement();knob.classes.add('joystick-knob');root.children=[move,fire,look,pause,knob];
    const input=new TouchInput(),deltas:number[][]=[],actions:string[]=[];
    const controls=new TouchControls(root as unknown as HTMLElement,input,{allowed:()=>true,look:(x,y)=>deltas.push([x,y]),action:a=>{actions.push(a);if(a==='pause')controls.reset();}});
    move.dispatchEvent(pointer('pointerdown',1,55,55));move.dispatchEvent(pointer('pointermove',1,55,5));
    fire.dispatchEvent(pointer('pointerdown',2,20,20));look.dispatchEvent(pointer('pointerdown',3,30,30));look.dispatchEvent(pointer('pointermove',3,45,25));
    assert.ok(input.forward>.9);assert.equal(input.firing,true);assert.deepEqual(deltas,[[15,-5]]);assert.ok(move.held.has(1));
    move.dispatchEvent(pointer('pointercancel',1));assert.equal(input.forward,0);assert.equal(input.firing,true);assert.equal(move.held.size,0);
    fire.releasePointerCapture(2);assert.equal(input.firing,false);assert.equal(controls.captures.size,1);
    fire.dispatchEvent(pointer('pointerdown',4));window.dispatchEvent(new Event('orientationchange'));
    assert.equal(input.pointers.size,0);assert.equal(controls.captures.size,0);assert.equal(fire.held.size,0);assert.equal(look.held.size,0);
    fire.dispatchEvent(pointer('pointerdown',5));pause.dispatchEvent(pointer('pointerdown',6));assert.equal(input.firing,false);assert.equal(controls.captures.size,0);
    controls.dispose();fire.dispatchEvent(pointer('pointerdown',7));assert.equal(input.firing,false);assert.deepEqual(actions,['fire','fire','fire','pause']);
  });
});
test('les boutons de combat refusent une nouvelle capture lorsque le joueur est mort',()=>{
  withGlobal('window',new EventTarget(),()=>{
    const root=new FakeElement(),fire=new FakeElement('fire'),pause=new FakeElement('pause');root.children=[fire,pause];const input=new TouchInput(),actions:string[]=[];
    const controls=new TouchControls(root as unknown as HTMLElement,input,{allowed:a=>a==='pause'||a==='score',look:()=>assert.fail('Aucune visée après la mort'),action:a=>actions.push(a)});
    fire.dispatchEvent(pointer('pointerdown',1));pause.dispatchEvent(pointer('pointerdown',2));assert.equal(input.firing,false);assert.deepEqual(actions,['pause']);controls.dispose();
  });
});

test('les réglages mobiles migrent les anciens profils sans écraser leurs préférences',()=>{
  let saved:string|null=null;
  withGlobal('localStorage',{getItem:()=>saved},()=>{
    const mobile=loadSettings(true),desktop=loadSettings(false);
    assert.equal(mobile.quality,'ultra');assert.equal(mobile.fov,78);assert.equal(mobile.autoSprint,true);assert.equal(mobile.touchSensitivity,1);assert.equal(desktop.quality,'ultra');
    saved=JSON.stringify({quality:'ultra',sensitivity:1.7,volume:0,fov:92,callsign:'NOVA'});
    const migrated=loadSettings(true);assert.equal(migrated.quality,'ultra');assert.equal(migrated.sensitivity,1.7);assert.equal(migrated.volume,0);assert.equal(migrated.callsign,'NOVA');assert.equal(migrated.touchSensitivity,1);
    saved=JSON.stringify({touchSensitivity:50,autoSprint:false});assert.equal(loadSettings(true).touchSensitivity,3);assert.equal(loadSettings(true).autoSprint,false);
  });
  assert.equal(touchDevice(true,0,1366),true);assert.equal(touchDevice(false,5,390),true);assert.equal(touchDevice(false,0,1920),false);assert.equal(touchDevice(false,10,1920),false);
});
test('les tampons de rendu respectent le budget mobile en portrait, paysage et sur tablette',()=>{
  for(const quality of ['performance','balanced','ultra'] as const)for(const [w,h] of [[390,844],[844,390],[1366,1024],[3840,2160]])for(const adaptiveScale of [1,.5]){
    withGlobal('window',{visualViewport:{width:w,height:h}},()=>{
      let ratio=1;const renderer={setPixelRatio:(r:number)=>ratio=r,setSize:()=>{},getDrawingBufferSize:(v:T.Vector2)=>v.set(Math.floor(w*ratio),Math.floor(h*ratio))};
      const game=Object.assign(Object.create(Game.prototype),{mobile:true,settings:{...DEFAULT_SETTINGS,quality},adaptiveScale,renderer,composer:{setPixelRatio:()=>{},setSize:()=>{}},camera:new T.PerspectiveCamera(),gunCamera:new T.PerspectiveCamera(),fxaa:{uniforms:{resolution:{value:new T.Vector2()}}},film:{uniforms:{texel:{value:new T.Vector2()}}},effects:{setResolution:()=>{}}}) as Game;
      game.resize();const budget=renderBudget(quality,true);assert.ok(w*h*ratio*ratio<=budget.pixels+1);assert.ok(ratio<=budget.ratio);assert.ok(ratio>0);near(game.camera.aspect,w/h);assert.ok(game.resolution.includes(' × '));
    });
  }
  assert.equal(renderBudget('performance',true).shadows,0);assert.equal(renderBudget('balanced',true).bloom,false);assert.equal(renderBudget('ultra',false).pixels,3840*2160);
});
test('une partie mobile démarre et reprend sans demander la capture de souris',()=>{
  const states:string[]=[],touch=new TouchInput();let audioStarts=0;
  const game=Object.assign(Object.create(Game.prototype),{visuals:new Map(),mobile:true,touch,settings:{...DEFAULT_SETTINGS},inventory:new Map(),keys:new Set(),locked:false,
    audio:{init:()=>audioStarts++},world:{map:createMap('harbor'),setObjectivesVisible:()=>{}},clearActors:()=>{},setMap:()=>{},resize:()=>{},spawn:()=>{},switchWeapon:()=>{},addBot:()=>{},spawnWave:()=>{},
    nav:new Navigation(88,72,createMap('harbor').props),scene:new T.Scene(),hooks:{state:(s:string)=>states.push(s),event:()=>{}},lockMouse:()=>assert.fail('La capture souris est interdite sur mobile')}) as Game;
  for(const mode of ['tdm','domination','hardpoint','survival'] as const){
    game.start({mode,map:'harbor',difficulty:'regular',bots:7,weapon:'ar',duration:180});assert.equal(game.state,'playing');
    touch.begin(1,'fire',{x:0,y:0});touch.aim=true;game.pause();assert.equal(game.state,'paused');assert.equal(touch.firing,false);assert.equal(touch.aim,false);
    game.resume();assert.equal(game.state,'playing');assert.ok(Number.isFinite(game.lastFrame));game.supplyVisuals?.dispose();
  }
  assert.equal(audioStarts,8);assert.deepEqual(states,Array.from({length:4},()=>['playing','paused','playing']).flat());
});
test('le moteur déplace le joueur au joystick, tire à la cadence de l’arme et s’arrête au relâchement',()=>{
  const player=createActor(0,'TEST',0,WEAPONS[2],true),touch=new TouchInput();player.yaw=0;
  const map=createMap('harbor');map.props=[];
  const game=Object.assign(Object.create(Game.prototype),{mobile:true,state:'playing',player,touch,settings:{...DEFAULT_SETTINGS,autoSprint:false},keys:new Set(),world:{map},time:0,
    slideTime:0,slideCooldown:0,slideDir:{x:0,z:0},stamina:100,velocityY:0,grounded:true,eyeHeight:1.63,walkTime:0,stepTime:0,aimAmount:0,recoil:0,mouseX:0,mouseY:0,mouseDown:false,shots:0,shotPulse:0,viewKick:0,reloadStage:0,
    noises:[],camera:new T.PerspectiveCamera(),gunCamera:new T.PerspectiveCamera(),gun:new T.Group(),audio:{footstep:()=>{},reload:()=>{}},shoot:(a:typeof player)=>a.ammo--}) as Game;
  touch.begin(1,'move',{x:0,y:-48},{x:0,y:0});touch.begin(2,'fire',{x:100,y:100});
  for(let i=0;i<60;i++){game.time+=1/60;game.updatePlayer(1/60);}
  assert.ok(player.z<-3);assert.ok(game.shots>=2&&game.shots<=Math.ceil(1/player.weapon.fireInterval)+1);const shots=game.shots;
  touch.release(2);for(let i=0;i<30;i++)game.updatePlayer(1/60);assert.equal(game.shots,shots);
  game.settings.autoSprint=true;game.updatePlayer(1/60);assert.ok(Math.hypot(player.vx,player.vz)>5);assert.ok(game.stamina<100);
  game.touchAction('aim');game.updatePlayer(1/60);assert.equal(game.aimDown,true);assert.ok(Math.hypot(player.vx,player.vz)<4);
  touch.release(1);const z=player.z;game.updatePlayer(1/60);near(player.z,z);
});
