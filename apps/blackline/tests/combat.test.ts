import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { reloadPose, reloadProgress, surfaceNormal, tracerSegment } from '../src/combat-motion.ts';
import { animateWeaponParts } from '../src/viewmodel.ts';
import { createWeapon, disposeModel } from '../src/world.ts';
import { Effects } from '../src/effects.ts';
import { Game } from '../src/game.ts';
import { createActor } from '../src/ai.ts';
import { createMap } from '../src/maps.ts';
import { DEFAULT_SETTINGS, WEAPONS } from '../src/types.ts';
import { TouchInput } from '../src/input.ts';

test('le rechargement extrait, masque, réinsère le chargeur puis revient exactement au repos',()=>{
  for(const w of WEAPONS){
    const gun=createWeapon(w,true),mag=gun.getObjectByName('magazine')!,hand=gun.getObjectByName('support-hand')!,bolt=gun.getObjectByName('charging-handle')!;
    const rests=[mag.position.clone(),hand.position.clone(),bolt.position.clone()];
    animateWeaponParts(gun,.35,0);assert.ok(mag.position.y<rests[0].y-.2);assert.ok(hand.position.y<rests[1].y);assert.equal(mag.visible,true);
    animateWeaponParts(gun,.5,0);assert.equal(mag.visible,false);animateWeaponParts(gun,.7,0);assert.equal(mag.visible,true);
    animateWeaponParts(gun,.88,0);assert.ok(bolt.position.z>rests[2].z);
    for(let i=0;i<10;i++)animateWeaponParts(gun,1,0);
    for(const [i,part]of [mag,hand,bolt].entries())assert.ok(part.position.distanceTo(rests[i])<1e-9);
    assert.equal(mag.visible,true);assert.equal(gun.getObjectByName('muzzle-flash')!.visible,false);animateWeaponParts(gun,1,1);assert.equal(gun.getObjectByName('muzzle-flash')!.visible,true);
    for(let i=0;i<=100;i++)for(const value of Object.values(reloadPose(i/100)))if(typeof value==='number')assert.ok(Number.isFinite(value));disposeModel(gun);
  }
  assert.equal(reloadProgress(0,2.1),1);assert.equal(reloadProgress(2.1,2.1),0);assert.equal(reloadPose(.5).phase,'INSERTION');
});
test('les traînées avancent vers l’impact sans dessiner un laser permanent ni dépasser la cible',()=>{
  const from={x:0,y:1,z:0},to={x:100,y:1,z:0};
  for(let i=0;i<=10;i++){const s=tracerSegment(from,to,.075*i/10);assert.ok(s.start.x>=0&&s.end.x<=100);assert.ok(s.end.x-s.start.x<=7.00001);assert.ok(s.end.x>=s.start.x);}
  assert.equal(tracerSegment(from,to,.075).end.x,100);
  const zero=tracerSegment(from,from,.01);assert.deepEqual(zero.start,from);assert.deepEqual(zero.end,from);
});
test('les marques d’impact s’orientent vers la bonne face des bâtiments',()=>{
  const box={x:0,z:0,w:4,d:8,h:6};
  assert.deepEqual(surfaceNormal({x:-2,y:2,z:0},box),{x:-1,y:0,z:0});
  assert.deepEqual(surfaceNormal({x:1,y:2,z:4},box),{x:0,y:0,z:1});
  assert.deepEqual(surfaceNormal({x:0,y:6,z:0},box),{x:0,y:1,z:0});
  assert.deepEqual(surfaceNormal({x:0,y:3,z:0},{...box,y:3}),{x:0,y:-1,z:0});
});
test('fumées, douilles, éclairs et marques utilisent des pools bornés et se réinitialisent',()=>{
  const scene=new T.Scene(),effects=new Effects(scene,140),counts=[effects.particles.length,effects.smoke.length,effects.shells.length,effects.marks.length,effects.root.children.length];
  effects.setQuality('performance');effects.setResolution(540);
  for(let i=0;i<200;i++){
    effects.shot({x:0,y:1.4,z:0},{x:20,y:1.2,z:-10},i%2===0);effects.impact({x:10,y:1,z:0},false,{x:-1,y:0,z:0},i%2===0);effects.eject({x:0,y:1.2,z:0},{x:1,y:0,z:0});effects.update(1/60);
  }
  assert.deepEqual([effects.particles.length,effects.smoke.length,effects.shells.length,effects.marks.length,effects.root.children.length],counts);
  effects.explosion({x:0,y:.2,z:0});for(let i=0;i<240;i++)effects.update(1/60);
  for(const p of [...effects.particles,...effects.smoke,...effects.shells]){assert.equal(p.life,0);for(const n of [p.x,p.y,p.z])assert.ok(Number.isFinite(n));}
  assert.ok(effects.tracers.every(t=>!t.mesh.visible));assert.ok(effects.muzzles.every(m=>!m.root.visible));
  effects.clear();assert.ok(effects.marks.every(m=>!m.mesh.visible));assert.equal(effects.flash.intensity,0);
  for(const name of ['position','aSize','aAlpha','aTint'])assert.ok([...effects.smokeCloud.geometry.attributes[name].array].every(Number.isFinite));
  effects.root.traverse(o=>{if(!(o instanceof T.Mesh||o instanceof T.Points))return;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(!(m instanceof T.ShaderMaterial))continue;for(const source of [m.vertexShader,m.fragmentShader]){const includes=source.match(/#include\s*<\w+>/g)??[],lines=[...source.matchAll(/^[ \t]*#include\s*<(\w+)>/gm)];assert.equal(includes.length,lines.length);for(const item of lines)assert.ok((T.ShaderChunk as any)[item[1]],item[1]);}}});
});

function playerGame(){
  const player=createActor(0,'TEST',0,WEAPONS[2],true),events:string[]=[],gun=createWeapon(player.weapon,true),scene=new T.Scene();scene.add(gun);
  const game=Object.assign(Object.create(Game.prototype),{collection:{purchases:['weapon-shotgun','weapon-lmg'],shot:'standard',kill:'none'},mobile:false,state:'playing',player,touch:new TouchInput(),settings:{...DEFAULT_SETTINGS,cameraShake:false},keys:new Set(),world:{map:{...createMap('harbor'),props:[]}},time:0,
    slideTime:0,slideCooldown:0,slideDir:{x:0,z:0},stamina:100,velocityY:0,grounded:true,eyeHeight:1.63,walkTime:0,stepTime:0,aimAmount:0,aimDown:false,recoil:0,mouseX:0,mouseY:0,mouseDown:false,shots:0,shotPulse:0,viewKick:0,reloadStage:0,
    noises:[],camera:new T.PerspectiveCamera(84),gunCamera:new T.PerspectiveCamera(64),gun,gunScene:scene,inventory:new Map(WEAPONS.map(w=>[w.id,{ammo:w.mag,reserve:w.reserve}])),
    audio:{footstep:()=>{},reload:()=>events.push('start'),reloadStep:(s:number)=>events.push(String(s))},hooks:{event:()=>{}},shoot:()=>assert.fail('Aucun tir pendant le rechargement')}) as Game;
  return {game,player,events};
}
test('les automatiques utilisent une optique claire avec moins de zoom que le sniper, avec arme visible et optique ouverte',()=>{
  for(const w of WEAPONS){const {game,player}=playerGame();game.switchWeapon(w.id);game.aimDown=true;
    for(let i=0;i<40;i++)game.updatePlayer(1/60);
    assert.equal(game.scoped(),true);assert.equal(game.gun.visible,true);assert.ok(Math.abs(game.camera.fov-game.aimFov())<1);
    if((w.model??w.id)!=='dmr')assert.ok(w.zoom>WEAPONS[2].zoom*1.8);
    player.reloadTime=.5;game.updatePlayer(1/60);assert.equal(game.scoped(),false);assert.equal(game.gun.visible,true);
    game.aimDown=false;player.reloadTime=0;for(let i=0;i<40;i++)game.updatePlayer(1/60);assert.equal(game.gun.visible,true);assert.ok(game.camera.fov>83);
  }
});
test('le chargeur réel n’est rempli qu’à la fin ; les trois sons et la visée restent synchronisés',()=>{
  const {game,player,events}=playerGame();player.ammo=2;player.reserve=30;game.aimDown=true;game.reloadPlayer();game.firePlayer();assert.equal(player.ammo,2);
  for(let i=0;i<60;i++)game.updatePlayer(1/60);assert.equal(player.ammo,2);assert.ok(player.reloadTime>0);assert.ok(game.camera.fov>70);
  for(let i=0;i<110;i++)game.updatePlayer(1/60);assert.equal(player.reloadTime,0);assert.equal(player.ammo,12);assert.equal(player.reserve,20);assert.deepEqual(events,['start','1','2','3']);
  assert.equal(game.gun.getObjectByName('magazine')!.visible,true);assert.ok(game.camera.fov<45);
});
test('changer d’arme annule le rechargement sans ajouter de munitions ni conserver une pose intermédiaire',()=>{
  const {game,player}=playerGame();player.ammo=2;player.reserve=30;game.reloadPlayer();for(let i=0;i<60;i++)game.updatePlayer(1/60);
  game.switchWeapon('ar');assert.equal(player.reloadTime,0);game.switchWeapon('dmr');assert.equal(player.ammo,2);assert.equal(player.reserve,30);assert.equal(game.shotPulse,0);assert.equal(game.gun.getObjectByName('magazine')!.visible,true);
});
test('le hitscan fournit un impact de mur et de sol avec normales et bruit borné par la collision',()=>{
  const player=createActor(0,'TEST',0,WEAPONS[0],true);player.x=-4;player.yaw=-Math.PI/2;
  const camera=new T.PerspectiveCamera(84);camera.position.set(-4,1.6,0);camera.rotation.y=-Math.PI/2;
  const impacts:{pos:unknown;normal:unknown}[]=[],noises:any[]=[];
  const game=Object.assign(Object.create(Game.prototype),{player,actors:[player],eyeHeight:1.6,camera,gunCamera:new T.PerspectiveCamera(64),gun:createWeapon(WEAPONS[0],true),world:{map:{props:[{kind:'building',x:0,z:0,w:2,d:8,h:4}]}},time:1,noises,
    effects:{shot:()=>{},impact:(pos:unknown,_body:boolean,normal:unknown)=>impacts.push({pos,normal}),eject:()=>{}},audio:{shot:()=>{}}}) as Game;
  game.shoot(player,{x:1,y:0,z:0});assert.deepEqual(impacts[0],{pos:{x:-1,y:1.6,z:0},normal:{x:-1,y:0,z:0}});assert.equal(noises[0].length,3);
  game.shoot(player,{x:0,y:-1,z:0});assert.deepEqual(impacts[1],{pos:{x:-4,y:0,z:0},normal:{x:0,y:1,z:0}});assert.equal(noises[1].length,1.6);
});
