import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Game } from '../src/game.ts';
import { UI } from '../src/ui.ts';
import { TouchInput } from '../src/input.ts';
import { DEFAULT_SETTINGS } from '../src/types.ts';
import { WEAPONS } from '../src/types.ts';
import { createWeapon, disposeModel } from '../src/world.ts';

function session(request:()=>unknown=()=>undefined,alive=true){
  const states:string[]=[],notices:string[]=[];
  const g=Object.assign(Object.create(Game.prototype),{state:'paused',mobile:false,locked:false,desktopFallback:false,fallbackNotified:false,fallbackPointer:null,
    player:{alive,yaw:0,pitch:0},touch:new TouchInput(),keys:new Set(),callbacks:[],settings:{...DEFAULT_SETTINGS},camera:new T.PerspectiveCamera(84),
    renderer:{domElement:{requestPointerLock:request}},audio:{init:()=>{}},hooks:{state:(s:string)=>states.push(s),event:(_t:string,d:{text:string})=>notices.push(d.text)}}) as Game;
  return {g,states,notices};
}
test('les verres des trois viseurs 3D laissent voir le terrain au lieu de le masquer',()=>{
  for(const w of WEAPONS){const gun=createWeapon(w,true),glass:T.Material[]=[];
    gun.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material instanceof T.MeshPhysicalMaterial)glass.push(o.material);});
    assert.ok(glass.length>0);assert.ok(glass.every(m=>m.transparent&&m.opacity<.2&&!m.depthWrite));disposeModel(gun);
  }
});
test('le centre des trois optiques est ouvert : aucune plaque ni bouchon opaque sur l’axe',()=>{
  for(const w of WEAPONS){const gun=createWeapon(w),height=w.id==='dmr'?.21:w.id==='pistol'?.16:.23;gun.updateMatrixWorld(true);
    const ray=new T.Raycaster(new T.Vector3(0,height,.2),new T.Vector3(0,0,-1),0,.8);
    const opaque=ray.intersectObject(gun,true).filter(hit=>{const mat=(hit.object as T.Mesh).material;return !Array.isArray(mat)&&!mat.transparent;});
    assert.equal(opaque.length,0,`${w.name} : ouverture masquée`);disposeModel(gun);
  }
});
test('Reprendre retire la pause immédiatement, sans attendre un événement de capture de souris',()=>{
  const {g,states}=session();g.touch.begin(1,'fire',{x:0,y:0});g.resume();
  assert.equal(g.state,'playing');assert.deepEqual(states,['playing']);assert.equal(g.touch.firing,false);assert.ok(Number.isFinite(g.lastFrame));assert.equal(g.desktopFallback,true);
});
test('Reprendre fonctionne quand la souris est déjà capturée et ne redemande pas la capture',()=>{
  const {g}=session(()=>assert.fail('Ne pas redemander la capture'));g.locked=true;g.resume();assert.equal(g.state,'playing');
});
test('un refus asynchrone de capture ne remet pas la partie en pause',async()=>{
  const {g,notices}=session(()=>Promise.reject(new Error('NotAllowedError')));g.resume();await Promise.resolve();
  assert.equal(g.state,'playing');assert.equal(g.desktopFallback,true);assert.equal(notices.length,1);
});
test('une capture absente ou un refus synchrone permet de reprendre sans bloquer le jeu',()=>{
  for(const request of [()=>{throw new Error('SecurityError')},undefined]){const {g}=session();g.renderer.domElement.requestPointerLock=request as any;g.resume();assert.equal(g.state,'playing');assert.equal(g.desktopFallback,true);}
});
test('un audio indisponible ne bloque pas la reprise et un refus tardif ne quitte pas la pause choisie',async()=>{
  const {g}=session(()=>Promise.reject(new Error('NotAllowedError')));g.audio.init=()=>{throw new Error('audio unavailable')};g.resume();assert.equal(g.state,'playing');
  g.pause(false);await Promise.resolve();assert.equal(g.state,'paused');
});
test('une vraie capture désactive le glissement ; Échap après capture met en pause',()=>{
  const {g}=session();g.resume();g.pointerLockChanged(true);assert.equal(g.desktopFallback,false);assert.equal(g.state,'playing');g.pointerLockChanged(false);assert.equal(g.state,'paused');
});
test('la reprise d’un opérateur mort supprime aussi le panneau de pause',()=>{
  const {g,states}=session(()=>undefined,false);g.resume();assert.equal(g.state,'dead');assert.deepEqual(states,['dead']);
  let removed=0,appended=0;const previous=(globalThis as any).document;
  (globalThis as any).document={createElement:()=>({})};
  const ui=Object.assign(Object.create(UI.prototype),{app:{classList:{toggle:()=>{}},querySelector:(s:string)=>s==='#pause-layer'?{remove:()=>removed++}:s==='#hud'?{}:null,appendChild:()=>appended++}}) as UI;
  try{ui.stateChanged('dead');assert.equal(removed,1);assert.equal(appended,1);}finally{(globalThis as any).document=previous;}
});
test('sans capture, le glissement sur le canvas vise et le relâchement arrête le tir',()=>{
  const previousDocument=(globalThis as any).document,previousWindow=(globalThis as any).window;
  (globalThis as any).document=new EventTarget();(globalThis as any).window=new EventTarget();
  const {g}=session();const canvas=Object.assign(new EventTarget(),{setPointerCapture:()=>{}}),pointer=(type:string,props:Record<string,number>)=>Object.assign(new Event(type,{cancelable:true}),props);
  let shots=0;g.firePlayer=()=>{shots++};
  try{g.bindInput(canvas as any);g.resume();canvas.dispatchEvent(pointer('pointerdown',{pointerId:1,button:2,clientX:100,clientY:100}));
    canvas.dispatchEvent(pointer('pointermove',{pointerId:1,clientX:140,clientY:110}));assert.equal(g.aimDown,true);assert.ok(g.player.yaw<0);assert.ok(g.player.pitch<0);
    canvas.dispatchEvent(pointer('pointerup',{pointerId:1}));assert.equal(g.aimDown,false);
    canvas.dispatchEvent(pointer('pointerdown',{pointerId:2,button:0,clientX:100,clientY:100}));assert.equal(shots,1);assert.equal(g.mouseDown,true);canvas.dispatchEvent(pointer('pointercancel',{pointerId:2}));assert.equal(g.mouseDown,false);
  }finally{for(const c of g.callbacks)c();(globalThis as any).document=previousDocument;(globalThis as any).window=previousWindow;}
});
