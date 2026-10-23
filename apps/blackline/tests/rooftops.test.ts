import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Game } from '../src/game.ts';
import { Effects } from '../src/effects.ts';
import { createActor } from '../src/ai.ts';
import { DEFAULT_SETTINGS, WEAPONS } from '../src/types.ts';
import { TouchInput } from '../src/input.ts';
import { createWeapon } from '../src/world.ts';
import { createMap } from '../src/maps.ts';
import { circleBlocked, rayBox, visible } from '../src/math.ts';
import { aimSensitivity, shotSpread } from '../src/aim.ts';
import { buildingLadder, ladderExitClear, nearbyLadder, verticalStep } from '../src/traversal.ts';
import { Navigation } from '../src/navigation.ts';

function harness(index=2,mobile=false){
  const player=createActor(0,'TEST',0,WEAPONS[index],true),map=createMap('harbor');map.props=[];
  const game=Object.assign(Object.create(Game.prototype),{state:'playing',mobile,player,actors:[player],world:{map},settings:{...DEFAULT_SETTINGS,cameraShake:false,autoSprint:false},
    config:{mode:'tdm',map:'harbor'},touch:new TouchInput(),keys:new Set(),activeLadder:null,velocityY:0,grounded:true,coyoteTime:.1,jumpBuffer:0,fireBuffer:0,
    slideTime:0,slideCooldown:0,slideDir:{x:0,z:0},stamina:100,eyeHeight:1.63,walkTime:0,stepTime:0,aimAmount:0,aimDown:false,recoil:0,mouseX:0,mouseY:0,mouseDown:false,
    shots:0,shotPulse:0,viewKick:0,reloadStage:0,time:0,noises:[],camera:new T.PerspectiveCamera(84),gunCamera:new T.PerspectiveCamera(64),gun:createWeapon(player.weapon,true),
    audio:{footstep:()=>{},burst:()=>{},reload:()=>{},reloadStep:()=>{}},hooks:{event:()=>{}},shoot:(a:typeof player)=>a.ammo--}) as Game;
  return game;
}
function step(game:Game,seconds:number,fps=60){for(let i=0;i<Math.ceil(seconds*fps);i++){game.time+=1/fps;game.updatePlayer(1/fps);}}

test('les trois armes sautent et retombent, y compris le sniper en lunette et pendant le rechargement',()=>{
  for(let index=0;index<3;index++)for(const aiming of [false,true]){
    const g=harness(index);g.aimDown=aiming;step(g,.5);g.player.reloadTime=1;g.jumpPlayer();
    let peak=0;for(let i=0;i<100;i++){g.updatePlayer(1/60);peak=Math.max(peak,g.player.y);}
    assert.ok(peak>1.35);assert.equal(g.player.y,0);assert.equal(g.grounded,true);assert.equal(g.aimDown,aiming);
  }
});
test('le saut tactile reste disponible pendant la visée et avec les doigts de déplacement et de tir',()=>{
  const g=harness(2,true);g.touch.aim=true;g.touch.begin(1,'move',{x:0,y:-48},{x:0,y:0});g.touch.begin(2,'fire',{x:100,y:100});
  step(g,.5);g.touchAction('jump');step(g,.2);assert.ok(g.player.y>1);assert.equal(g.touch.aim,true);assert.equal(g.touch.firing,true);assert.equal(g.grounded,false);
});
test('un appui juste avant l’atterrissage ou après un rebord déclenche le saut, sans double saut',()=>{
  const g=harness();g.player.y=.08;g.grounded=false;g.coyoteTime=0;g.velocityY=-2;g.jumpPlayer();assert.equal(g.velocityY,-2);
  step(g,.05);assert.ok(g.velocityY>0);const vy=g.velocityY;g.jumpPlayer();assert.equal(g.velocityY,vy);
  const edge=harness();edge.grounded=false;edge.coyoteTime=.07;edge.player.y=3;edge.jumpPlayer();assert.ok(edge.velocityY>7);
});
test('les sols surélevés et plafonds bloquent la verticale, et une chute de toit atteint le sol',()=>{
  const slab={x:0,z:0,w:5,d:5,y:7,h:.22};let p={x:0,y:8,z:0},vy=-1,grounded=false;
  for(let i=0;i<60;i++){const s=verticalStep(p,vy,grounded,1/60,[slab]);p.y=s.y;vy=s.velocity;grounded=s.grounded;}
  assert.equal(p.y,7.22);assert.equal(grounded,true);
  p.x=8;for(let i=0;i<180;i++){const s=verticalStep(p,vy,grounded,1/60,[slab]);p.y=s.y;vy=s.velocity;grounded=s.grounded;}assert.equal(p.y,0);
  const ceiling=verticalStep({x:0,y:1,z:0},7,false,.04,[{x:0,z:0,w:3,d:3,y:2.7,h:.2}]);assert.ok(ceiling.y+1.63<=2.7+.00001);assert.equal(ceiling.velocity,0);
});
for(const id of ['harbor','outpost','forest','foundry'] as const)test(`${id} : les six échelles se rejoignent depuis le sol et permettent montée, saut et descente`,()=>{
  const map=createMap(id),nav=new Navigation(map.width,map.depth,map.props),buildings=map.props.filter(p=>p.kind==='building');assert.equal(buildings.length,6);
  for(const b of buildings){
    const l=buildingLadder(b),base={x:l.x,z:l.z+.5};assert.equal(circleBlocked(base,.36,map.props),false);assert.ok(nav.path(map.spawns[0][0],base).length>0);assert.ok(ladderExitClear(l,map.props));
    const g=harness();g.world.map=map;Object.assign(g.player,base);g.interactLadder();assert.ok(g.activeLadder);g.keys.add('KeyZ');step(g,4);
    assert.equal(g.activeLadder,null);assert.ok(g.player.y>=l.roofY);g.keys.clear();step(g,.5);assert.equal(g.grounded,true);
    Object.assign(g.player,{...l.exit,y:l.roofY});g.aimDown=true;g.jumpPlayer();step(g,.2);assert.ok(g.player.y>l.roofY+1);
    Object.assign(g.player,{...l.exit,y:l.roofY});g.velocityY=0;g.grounded=true;assert.ok(nearbyLadder(g.player,map.props));g.interactLadder();assert.ok(g.activeLadder);g.keys.add('KeyS');step(g,4);
    assert.equal(g.activeLadder,null);assert.equal(g.player.y,0);assert.equal(g.grounded,true);
  }
});
test('le toit et les couverts bloquent les tirs, et un opérateur peut voir depuis la toiture',()=>{
  const map=createMap('harbor'),b=map.props.find(p=>p.kind==='building')!,l=buildingLadder(b);
  const origin={x:b.x,y:l.roofY+5,z:b.z};const distances=map.props.map(p=>rayBox(origin,{x:0,y:-1,z:0},p)).filter((n):n is number=>n!==null);
  assert.ok(Math.abs(Math.min(...distances)-5)<.00001);
  assert.equal(visible({x:l.exit.x,y:l.roofY+1.63,z:l.exit.z},{x:l.exit.x,y:1.6,z:l.z+5},map.props),true);
});
test('la sensibilité suit le zoom, la visée stabilisée resserre le sniper et le tir ne dérive pas l’angle',()=>{
  assert.equal(aimSensitivity(84,84),1);assert.ok(aimSensitivity(28,84)<.29);
  assert.ok(aimSensitivity(28,84)<aimSensitivity(58,84));assert.ok(shotSpread(.003,1,0,true,true)<.00004);
  const g=harness();g.aimDown=true;step(g,.6);g.player.pitch=.12;g.firePlayer();assert.equal(g.player.pitch,.12);assert.ok(g.viewKick>0);assert.equal(g.shots,1);
});
test('les automatiques gardent la même cadence à 30, 60 et 144 Hz et s’arrêtent au relâchement',()=>{
  for(const index of [0,1]){const totals:number[]=[];for(const fps of [30,60,144]){
    const g=harness(index);g.player.ammo=200;g.mouseDown=true;step(g,4,fps);totals.push(g.shots);g.mouseDown=false;step(g,.5,fps);assert.equal(g.shots,totals.at(-1));
  }assert.ok(Math.max(...totals)-Math.min(...totals)<=1,JSON.stringify(totals));assert.ok(Math.min(...totals)>=Math.floor(4/WEAPONS[index].fireInterval));}
});
test('un clic sniper proche de la fin du délai est mémorisé une seule fois',()=>{
  const g=harness();g.player.fireTime=.08;g.firePlayer();assert.equal(g.shots,0);step(g,.15);assert.equal(g.shots,1);step(g,1);assert.equal(g.shots,1);
});
test('un nouveau traceur est positionné dès le tir, visible même sur une image de 40 ms et vite effacé',()=>{
  const e=new Effects(new T.Scene(),140);e.shot({x:1,y:2,z:3},{x:31,y:2,z:3},true);const t=e.tracers[0];
  assert.equal(t.mesh.position.x,16);assert.equal(t.mesh.scale.y,30);e.update(.04);assert.equal(t.mesh.visible,true);e.update(.04);e.update(.04);assert.equal(t.mesh.visible,false);
});

for(const id of ['harbor','outpost','forest','foundry'] as const)test(`${id} : un appui tactile monte, suspend, reprend puis descend sans joystick`,()=>{
 const g=harness(2,true);g.world.map=createMap(id);const l=buildingLadder(g.world.map.props.find(p=>p.kind==='building')!);Object.assign(g.player,{x:l.x,z:l.z+.5,y:0});
 g.touchAction('interact');step(g,.5);assert.ok(g.player.y>1);g.touchAction('interact');const y=g.player.y;step(g,.5);assert.equal(g.player.y,y);g.touchAction('interact');step(g,4);assert.equal(g.activeLadder,null);assert.ok(Math.abs(g.player.y-l.roofY)<.001);assert.ok(Math.abs(g.player.z-l.exit.z)<.01);
 g.touchAction('interact');assert.equal(g.ladderDirection,-1);step(g,4);assert.equal(g.activeLadder,null);assert.equal(g.player.y,0);assert.equal(g.grounded,true);
});
test('le mode échelle manuel attend une direction et le saut libère une transition descendante',()=>{const g=harness();g.settings.autoClimb=false;g.world.map=createMap('harbor');const l=buildingLadder(g.world.map.props.find(p=>p.kind==='building')!);Object.assign(g.player,{x:l.x,z:l.z,y:0});g.interactLadder();step(g,.5);assert.equal(g.player.y,0);g.keys.add('KeyZ');step(g,.5);assert.ok(g.player.y>1);g.keys.clear();g.jumpPlayer();assert.equal(g.activeLadder,null);assert.ok(g.velocityY>0);Object.assign(g.player,{...l.exit,y:l.roofY});g.interactLadder();assert.ok(g.climbEntry);g.jumpPlayer();assert.equal(g.climbEntry,null);assert.equal(g.activeLadder,null);});

test('une direction maintenue pour approcher le haut ne renvoie pas immédiatement sur le toit',()=>{const g=harness(2,true);g.world.map=createMap('harbor');const l=buildingLadder(g.world.map.props.find(p=>p.kind==='building')!);Object.assign(g.player,{...l.exit,y:l.roofY});g.touch.forward=1;g.interactLadder();step(g,.8);assert.ok(g.activeLadder);assert.ok(g.player.y<l.roofY-1);g.interactLadder();const y=g.player.y;step(g,.5);assert.equal(g.player.y,y);g.touch.forward=0;step(g,.1);g.interactLadder();step(g,4);assert.equal(g.player.y,0);});
