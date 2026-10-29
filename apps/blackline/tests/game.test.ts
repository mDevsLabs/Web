import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { circleBlocked, moveCircle, rayBox, raySphere, visible } from '../src/math.ts';
import { Navigation } from '../src/navigation.ts';
import { createMap } from '../src/maps.ts';
import { BotBrain, createActor } from '../src/ai.ts';
import type { AIContext } from '../src/ai.ts';
import { WEAPONS } from '../src/types.ts';
import type { Objective } from '../src/types.ts';
import { captureObjective, outcome, scoreElimination, tickObjectives } from '../src/rules.ts';
import { World, createSoldier, createWeapon, disposeModel } from '../src/world.ts';

test('les murs bloquent les tirs et le déplacement, sans traversée lors d’un grand pas',()=>{
  const box={x:0,z:0,w:2,d:12,h:3};const moved=moveCircle({x:-4,z:0},12,0,.36,[box],30,30);
  assert.ok(moved.x<=-1.34);assert.equal(rayBox({x:-4,y:1.6,z:0},{x:1,y:0,z:0},box),3);
  assert.equal(visible({x:-4,y:1.6,z:0},{x:4,y:1.6,z:0},[box]),false);
  assert.equal(visible({x:-4,y:4,z:0},{x:4,y:4,z:0},[box]),true);
  assert.equal(raySphere({x:0,y:1.6,z:0},{x:0,y:0,z:-1},{x:0,y:1.6,z:-10},.2)?.toFixed(2),'9.80');
  assert.equal(raySphere({x:0,y:1.6,z:0},{x:0,y:0,z:-1},{x:0,y:1.6,z:10},.2),null);
});
for(const id of ['harbor','outpost','forest','foundry'] as const){
  test(`${id} : toutes les apparitions et les trois objectifs sont accessibles`,()=>{
    const map=createMap(id),nav=new Navigation(map.width,map.depth,map.props);
    for(const team of map.spawns)for(const spawn of team){assert.equal(circleBlocked(spawn,.4,map.props),false);for(const objective of map.objectives){const path=nav.path(spawn,objective);assert.ok(path.length>0);for(const p of path)assert.equal(circleBlocked(p,.38,map.props),false);assert.ok(Math.hypot(path.at(-1)!.x-objective.x,path.at(-1)!.z-objective.z)<1);}}
  });
  test(`${id} : simulation tactique de 90 secondes, positions valides et engagements`,()=>{
    const map=createMap(id),nav=new Navigation(map.width,map.depth,map.props),actors=Array.from({length:8},(_,i)=>{const a=createActor(i,'BOT-'+i,i<4?0:1,WEAPONS[i%3]);const p=map.spawns[a.team][i%4];a.x=p.x;a.z=p.z;a.yaw=a.team===0?Math.PI*.72:-Math.PI*.28;return a;});
    let shots=0;const brains=actors.map(a=>new BotBrain(a,'regular',map));const objectives:Objective[]=map.objectives.map((p,i)=>({...p,id:String(i),owner:-1,progress:0,contested:false}));
    const ctx:AIContext={time:0,map,nav,actors,objectives,mode:'domination',noises:[],shoot:(a)=>{shots++;a.ammo--;}};
    for(let frame=0;frame<2700;frame++){ctx.time=frame/30;for(const b of brains)b.step(1/30,ctx);for(const a of actors){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.z)&&Number.isFinite(a.yaw));assert.ok(Math.abs(a.x)<map.width/2&&Math.abs(a.z)<map.depth/2);assert.equal(circleBlocked(a,.37,map.props),false);}}
    assert.ok(shots>20,`Les bots doivent se rencontrer et engager : ${shots}`);
    assert.ok(actors.some(a=>Math.hypot(a.x,a.z)<20));
  });
}
test('A* ne coupe pas les angles des obstacles',()=>{
  const boxes=[{x:0,z:0,w:6,d:8,h:3}],nav=new Navigation(24,24,boxes),path=nav.path({x:-9,z:0},{x:9,z:0});assert.ok(path.some(p=>Math.abs(p.z)>4.4));for(const p of path)assert.equal(circleBlocked(p,.39,boxes),false);
});
test('la domination exige une capture, bloque les points contestés et neutralise avant de retourner',()=>{
  const o:Objective={x:0,z:0,id:'B',owner:-1,progress:0,contested:false};for(let i=0;i<6;i++)captureObjective(o,[1,0],1);assert.equal(o.owner,0);assert.equal(o.progress,1);
  const scores:[number,number]=[0,0];tickObjectives(scores,[o]);assert.deepEqual(scores,[1,0]);captureObjective(o,[1,1],2);tickObjectives(scores,[o]);assert.deepEqual(scores,[1,0]);assert.equal(o.progress,1);
  for(let i=0;i<6;i++)captureObjective(o,[0,1],1);assert.equal(o.owner,-1);for(let i=0;i<6;i++)captureObjective(o,[0,1],1);assert.equal(o.owner,1);tickObjectives(scores,[o]);assert.deepEqual(scores,[1,1]);
});
test('les éliminations ne donnent des points qu’en match à mort et ne récompensent pas les suicides',()=>{
  const scores:[number,number]=[0,0];scoreElimination(scores,'domination',0,1);scoreElimination(scores,'survival',0,1);scoreElimination(scores,'tdm',0,0);assert.deepEqual(scores,[0,0]);scoreElimination(scores,'tdm',0,1);assert.deepEqual(scores,[1,0]);
  assert.equal(outcome([40,12],'tdm',50,300),'win');assert.equal(outcome([12,40],'tdm',50,300),'loss');assert.equal(outcome([5,5],'tdm',300,300),'draw');assert.equal(outcome([90,80],'domination',10,300),null);assert.equal(outcome([0,0],'survival',5000,0),null);
});
test('les modèles 3D conservent leur échelle et utilisent des groupes fusionnés',()=>{
  for(const w of WEAPONS){const gun=createWeapon(w);const bounds=new T.Box3().setFromObject(gun);assert.ok(bounds.getSize(new T.Vector3()).z>(w.id==='pistol'?.45:1));assert.ok(gun.children.length<=10);disposeModel(gun);}
  const v=createSoldier(0,WEAPONS[0]),box=new T.Box3().setFromObject(v.root);assert.ok(box.max.y>1.75&&box.max.y<2);let meshes=0;v.root.traverse(o=>{if(o instanceof T.Mesh)meshes++;});assert.ok(meshes<32,`${meshes} maillages`);disposeModel(v.root);
});
test('la perception respecte les murs ; un bruit déclenche une recherche, pas un tir à travers un mur',()=>{
  const map=createMap('harbor');map.props=[{kind:'wall',x:0,z:0,w:2,d:12,h:3}];
  const a=createActor(1,'A',0,WEAPONS[0]),b=createActor(2,'B',1,WEAPONS[0]);a.x=-4;a.z=0;a.yaw=-Math.PI/2;b.x=4;b.z=0;a.protectedTime=b.protectedTime=0;
  const brain=new BotBrain(a,'veteran',map),nav=new Navigation(map.width,map.depth,map.props);let shots=0;const ctx:AIContext={time:1,map,nav,actors:[a,b],objectives:[],mode:'tdm',noises:[{x:4,z:0,team:1,time:1}],shoot:()=>{shots++;}};
  brain.perceive(ctx);assert.equal(brain.target,null);assert.deepEqual(brain.lastKnown,{x:4,z:0});brain.step(.03,ctx);assert.equal(shots,0);
  map.props=[];brain.perceive(ctx);assert.equal(brain.target,b);assert.ok(brain.reaction>0);
});
test('les deux scènes et leurs shaders se construisent, et les objectifs se masquent ensemble',()=>{
  const oldDocument=(globalThis as any).document;
  const context={createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},ellipse(){},fill(){},fillRect(){},strokeRect(){},fillText(){},createRadialGradient:()=>({addColorStop(){}})};
  (globalThis as any).document={createElement:()=>({width:0,height:0,getContext:()=>context})};
  try{for(const id of ['harbor','outpost','forest','foundry'] as const){const scene=new T.Scene(),world=new World(scene,createMap(id));assert.equal(world.objectives.length,3);let meshes=0,vertices=0;
    world.root.traverse(o=>{if(!(o instanceof T.Mesh))return;meshes++;vertices+=o.geometry.attributes.position.count;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m instanceof T.ShaderMaterial)for(const src of [m.vertexShader,m.fragmentShader]){const tokens=src.match(/#include\s*<\w+>/g)??[],directives=[...src.matchAll(/^[ \t]*#include\s*<(\w+)>/gm)];assert.equal(tokens.length,directives.length,'Les directives doivent commencer sur une ligne distincte.');for(const d of directives)assert.ok((T.ShaderChunk as any)[d[1]],d[1]);}}
    );assert.ok(vertices>20000);assert.ok(meshes<170,`${id} : ${meshes} maillages`);assert.ok(world.facadeTexture);assert.ok(world.relief instanceof T.DataTexture);assert.ok(world.details.children.length>0);world.setQuality('performance');assert.equal(world.details.visible,false);assert.ok(world.textures.every(t=>t.anisotropy===2));world.setQuality('ultra');assert.equal(world.details.visible,true);world.setObjectivesVisible(false);for(const o of world.objectives){assert.equal(o.root.visible,false);assert.equal(o.root.children.length,5);}world.update(.016);world.dispose();assert.equal(scene.children.length,0);}
  }finally{(globalThis as any).document=oldDocument;}
});
