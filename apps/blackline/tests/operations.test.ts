import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createActor, BotBrain } from '../src/ai.ts';
import type { AIContext } from '../src/ai.ts';
import { WEAPONS, DEFAULT_SETTINGS } from '../src/types.ts';
import type { Objective } from '../src/types.ts';
import { createMap } from '../src/maps.ts';
import { Navigation } from '../src/navigation.ts';
import { collectSupply, createSupplies, hardpointAt, pointControl } from '../src/mission.ts';
import { squadOrders } from '../src/squad.ts';
import { circleBlocked, distance, visible } from '../src/math.ts';
import { Game } from '../src/game.ts';
import { UI } from '../src/ui.ts';
import { outcome } from '../src/rules.ts';
import { SupplyVisuals, createGrenade, disposeEquipment } from '../src/equipment.ts';
import { surfaceMaps } from '../src/surfaces.ts';

function context():AIContext{
  const map=createMap('harbor');map.props=[];
  return {time:2,map,nav:new Navigation(map.width,map.depth,map.props),actors:[],objectives:map.objectives.map((p,i)=>({...p,id:String.fromCharCode(65+i),owner:-1,progress:0,contested:false})),mode:'tdm',noises:[],shoot:()=>{}};
}
test('le point tourne exactement toutes les 40 secondes sans répéter deux zones voisines',()=>{
  assert.deepEqual(hardpointAt(0),{index:1,nextIndex:2,remaining:40});assert.equal(hardpointAt(39.9).index,1);assert.equal(hardpointAt(40).index,2);assert.equal(hardpointAt(80).index,0);
  for(let i=0;i<100;i++){const p=hardpointAt(i*40);assert.notEqual(p.index,p.nextIndex);assert.equal(p.remaining,40);}
  assert.equal(hardpointAt(-10).remaining,40);assert.equal(hardpointAt(20,1).index,0);
});
test('seule une équipe non contestée reçoit le contrôle ; les morts et les acteurs trop hauts ne comptent pas',()=>{
  const a=createActor(0,'P',0,WEAPONS[0],true),b=createActor(1,'B',1,WEAPONS[0]);
  assert.deepEqual(pointControl({x:0,z:0},[a]),{owner:0,contested:false,counts:[1,0]});
  assert.equal(pointControl(a,[a,b]).contested,true);assert.equal(pointControl(a,[a,b]).owner,-1);b.alive=false;assert.equal(pointControl(a,[a,b]).owner,0);
  a.y=4;assert.equal(pointControl({x:0,z:0},[a,b]).owner,-1);
});
test('le moteur attribue les points stratégiques, bloque les zones contestées et bascule leur représentation',()=>{
  const ctx=context(),a=createActor(0,'P',0,WEAPONS[0],true),b=createActor(1,'B',1,WEAPONS[0]);b.x=20;const active:number[]=[],events:string[]=[];
  const game=Object.assign(Object.create(Game.prototype),{config:{mode:'hardpoint',duration:300},matchTime:1,objectives:ctx.objectives,actors:[a,b],player:a,score:[0,0],scoreTick:0,pointIndex:-1,holdTime:0,playerScore:0,
    world:{setObjectivesVisible:(_v:boolean,i:number)=>active.push(i),setObjective:()=>{}},hooks:{event:(s:string)=>events.push(s)},finish:()=>assert.fail('Partie non terminée')}) as Game;
  for(let i=0;i<5;i++)game.updateModes(1);assert.deepEqual(game.score,[5,0]);assert.equal(game.playerScore,25);assert.deepEqual(active,[1]);
  b.x=0;game.updateModes(1);assert.deepEqual(game.score,[5,0]);assert.equal(game.objectives[1].contested,true);
  game.matchTime=40;game.updateModes(1);assert.equal(game.pointIndex,2);assert.equal(game.objectives[1].owner,-1);assert.deepEqual(active,[1,2]);assert.equal(events.filter(e=>e==='rotation').length,2);
  assert.equal(outcome([150,140],'hardpoint',120,300),'win');assert.equal(outcome([12,12],'hardpoint',300,300),'draw');
});
for(const id of ['harbor','outpost'] as const)test(`${id} : chaque ravitaillement est libre et accessible depuis les deux équipes`,()=>{
  const map=createMap(id),nav=new Navigation(map.width,map.depth,map.props),supplies=createSupplies(map,nav);assert.equal(supplies.length,6);
  for(const s of supplies){assert.equal(circleBlocked(s,.45,map.props),false);for(const team of map.spawns)assert.ok(nav.path(team[0],s).length>0);}
});
test('les ressources sont plafonnées, ne remplissent pas le chargeur et réapparaissent après le délai',()=>{
  const a=createActor(0,'P',0,WEAPONS[0],true),ammo={x:0,z:0,id:0,kind:'ammo' as const,readyAt:0},medical={...ammo,id:1,kind:'medical' as const};
  a.ammo=4;a.reserve=150;assert.equal(collectSupply(a,ammo,1),true);assert.equal(a.reserve,180);assert.equal(a.ammo,4);assert.equal(ammo.readyAt,26);a.reserve=0;
  assert.equal(collectSupply(a,ammo,25.99),false);assert.equal(collectSupply(a,ammo,26),true);assert.equal(a.reserve,90);
  a.hp=75;assert.equal(collectSupply(a,medical,3),true);assert.equal(a.hp,100);assert.equal(medical.readyAt,23);a.hp=20;a.alive=false;assert.equal(collectSupply(a,medical,24),false);a.alive=true;a.y=2;assert.equal(collectSupply(a,medical,24),false);
});
test('les caisses ont des géométries réutilisées, se masquent au ramassage et se libèrent au départ',()=>{
  const scene=new T.Scene(),ctx=context(),supplies=createSupplies(ctx.map,ctx.nav),v=new SupplyVisuals(scene,supplies);assert.equal(v.items.length,6);assert.equal(v.items[0].crate.geometry,v.items[1].crate.geometry);
  supplies[0].readyAt=20;v.update(supplies,19);assert.equal(v.items[0].root.visible,false);v.update(supplies,20);assert.equal(v.items[0].root.visible,true);v.dispose();assert.equal(scene.children.length,0);
  const g=createGrenade();assert.ok(g.getObjectByName('fuse-light'));assert.ok(g.children.length>=10);assert.ok(new T.Box3().setFromObject(g).getSize(new T.Vector3()).y>.25);disposeEquipment(g);
});
test('les ordres sont répartis par rôle et ne suivent jamais un adversaire invisible',()=>{
  const ctx=context(),assault=createActor(1,'A',0,WEAPONS[0]),anchor=createActor(2,'B',0,WEAPONS[0]),flanker=createActor(3,'C',0,WEAPONS[0]),enemy=createActor(4,'E',1,WEAPONS[0]);
  ctx.actors=[assault,anchor,flanker,enemy];ctx.intel=[new Map([[enemy.id,{position:{x:0,z:-20},time:1}]]),new Map()];
  const orders=squadOrders(ctx);assert.equal(orders.get(1)?.kind,'advance');assert.equal(orders.get(2)?.kind,'hold');assert.equal(orders.get(3)?.kind,'flank');assert.equal(orders.has(enemy.id),false);
  enemy.x=38;enemy.z=30;assert.deepEqual(squadOrders(ctx),orders);assert.notDeepEqual(orders.get(1)?.position,orders.get(3)?.position);
  ctx.time=5;assert.equal(squadOrders(ctx).size,0);
});
test('une partie de l’escouade anticipe une rotation et la domination répartit les objectifs',()=>{
  const ctx=context();ctx.actors=[1,2,3,4,5,6].map(id=>createActor(id,String(id),0,WEAPONS[0]));ctx.mode='hardpoint';ctx.time=35;
  const orders=squadOrders(ctx);assert.equal(orders.get(3)?.kind,'rotate');assert.ok(distance(orders.get(3)!.position,ctx.objectives[2])<1);assert.equal(orders.get(2)?.kind,'hold');
  ctx.mode='domination';assert.ok(new Set([...squadOrders(ctx).values()].map(o=>Math.round(o.position.x/10))).size>=2);
});
test('les points de flanc restent stables lors du déplacement et un soutien garde sa position',()=>{
  const ctx=context(),a=createActor(2,'ANCHOR',0,WEAPONS[0]),flanker=createActor(3,'FLANK',0,WEAPONS[0]),enemy=createActor(4,'ENEMY',1,WEAPONS[0]);ctx.mode='hardpoint';ctx.actors=[a,flanker,enemy];enemy.z=-18;enemy.protectedTime=0;
  const first=squadOrders(ctx).get(flanker.id)!.position;flanker.x+=7;flanker.z-=4;assert.deepEqual(squadOrders(ctx).get(flanker.id)!.position,first);
  ctx.orders=squadOrders(ctx);const brain=new BotBrain(a,'regular',ctx.map);brain.perceive(ctx);brain.chooseGoal(ctx);assert.equal(brain.state,'hold');assert.deepEqual(brain.goal,ctx.orders.get(a.id)!.position);
});
test('un PNJ à court de ressources cherche une caisse sans inventer de munitions',()=>{
  const ctx=context(),a=createActor(1,'A',0,WEAPONS[0]);ctx.actors=[a];ctx.supplies=[{id:0,x:8,z:0,kind:'ammo',readyAt:0}];a.ammo=0;a.reserve=0;
  const brain=new BotBrain(a,'regular',ctx.map);brain.step(.02,ctx);assert.equal(brain.state,'resupply');assert.deepEqual(brain.goal,{x:8,z:0});assert.equal(a.ammo,0);assert.equal(a.reserve,0);assert.equal(a.reloadTime,0);
});
test('les pas ont une portée courte et les murs atténuent leur perception',()=>{
  const ctx=context(),a=createActor(1,'A',0,WEAPONS[0]),brain=new BotBrain(a,'regular',ctx.map);ctx.actors=[a];ctx.noises=[{x:0,z:-15,team:1,time:2,kind:'step',radius:10}];brain.perceive(ctx);assert.equal(brain.lastKnown,null);
  ctx.noises=[{x:0,z:-5,team:1,time:2,kind:'step',radius:10}];brain.perceive(ctx);assert.ok(brain.lastKnown);assert.ok(distance(brain.lastKnown,ctx.noises[0])<1);
  brain.reset();ctx.map.props=[{kind:'wall',x:0,z:-2.5,w:6,d:1,h:3}];ctx.noises=[{x:0,z:-5,team:1,time:2,kind:'step',radius:10}];brain.perceive(ctx);assert.equal(brain.lastKnown,null);
});
test('une cible morte ou protégée est abandonnée avant de tirer',()=>{
  const ctx=context(),a=createActor(1,'A',0,WEAPONS[0]),b=createActor(2,'B',1,WEAPONS[0]);b.z=-10;a.protectedTime=0;ctx.actors=[a,b];ctx.shoot=()=>assert.fail('Tir interdit');const brain=new BotBrain(a,'regular',ctx.map);
  brain.target=b;brain.nextThink=Infinity;brain.step(.02,ctx);assert.equal(brain.target,null);b.protectedTime=0;b.alive=false;brain.target=b;brain.step(.02,ctx);assert.equal(brain.target,null);
});
test('la retraite tient compte seulement des ennemis vus et des soutiens proches',()=>{
  const ctx=context(),a=createActor(1,'A',0,WEAPONS[0]),b=createActor(2,'B',1,WEAPONS[0]);b.z=-10;b.protectedTime=0;a.hp=20;ctx.actors=[a,b];ctx.supplies=[{id:1,x:0,z:8,kind:'medical',readyAt:0}];const brain=new BotBrain(a,'veteran',ctx.map);
  brain.perceive(ctx);brain.chooseGoal(ctx);assert.equal(brain.visibleThreats,1);assert.equal(brain.state,'retreat');assert.deepEqual(brain.goal,{x:0,z:8});
});
test('les cartes PBR sont déterministes, mises en cache et correctement encodées',()=>{
  for(const kind of ['metal','polymer','fabric','camo'] as const){const maps=surfaceMaps(kind);assert.equal(surfaceMaps(kind),maps);assert.equal(maps.color.colorSpace,T.SRGBColorSpace);assert.equal(maps.normal.colorSpace,T.NoColorSpace);assert.equal(maps.roughness.colorSpace,T.NoColorSpace);for(const t of Object.values(maps)){assert.equal(t.image.width,256);assert.ok(t.generateMipmaps);assert.equal(t.wrapS,T.RepeatWrapping);}}
});
test('les quatre modes sont exposés par le menu PC et mobile',()=>{
  for(const mobile of [false,true]){const ui=Object.assign(Object.create(UI.prototype),{mobile,settings:{...DEFAULT_SETTINGS},config:{mode:'hardpoint',map:'harbor',weapon:'ar',bots:7,difficulty:'regular',duration:300},profile:{xp:0,matches:0}}) as UI;
    const page=ui.playPage();assert.equal((page.match(/data-mode=/g)??[]).length,4);assert.ok(page.includes('POINT STRATÉGIQUE'));assert.ok(page.includes('data-mode="hardpoint" aria-pressed="true"'));assert.ok(page.includes('4 MODES'));
  }
});
for(const id of ['harbor','outpost'] as const)test(`${id} : directeur tactique, point tournant et ravitaillement restent valides pendant 90 secondes`,()=>{
  const map=createMap(id),nav=new Navigation(map.width,map.depth,map.props),actors=Array.from({length:8},(_,i)=>{const a=createActor(i,'B'+i,i<4?0:1,WEAPONS[i%3]);Object.assign(a,map.spawns[a.team][i%4]);a.yaw=a.team===0?Math.PI*.72:-Math.PI*.28;return a;});
  const brains=actors.map(a=>new BotBrain(a,'regular',map)),objectives:Objective[]=map.objectives.map((p,i)=>({...p,id:String(i),owner:-1,progress:0,contested:false})),supplies=createSupplies(map,nav),intel:AIContext['intel']=[new Map(),new Map()];let shots=0,held=0;
  const ctx:AIContext={time:0,map,nav,actors,objectives,mode:'hardpoint',noises:[],supplies,intel,shoot:(a,d)=>{shots++;a.ammo--;const enemy=actors.find(t=>t.alive&&t.team!==a.team&&distance(a,t)<50&&visible({...a,y:1.6},{...t,y:1.6},map.props));if(enemy&&a.ammo%8===0){enemy.hp=Math.max(20,enemy.hp-12);enemy.lastDamaged=ctx.time;}assert.ok(Math.abs(Math.hypot(d.x,d.y,d.z)-1)<1e-5);}};
  for(let frame=0;frame<2700;frame++){ctx.time=frame/30;if(frame%20===0)ctx.orders=squadOrders(ctx);for(const brain of brains)brain.step(1/30,ctx);for(const s of supplies)for(const a of actors)if(collectSupply(a,s,ctx.time))break;
    if(pointControl(objectives[hardpointAt(ctx.time).index],actors).owner!==-1)held++;
    ctx.noises=ctx.noises.filter(n=>ctx.time-n.time<3);for(const a of actors){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.z)&&a.ammo>=0&&a.reserve>=0);assert.equal(circleBlocked(a,.37,map.props),false);}
  }
  assert.ok(shots>20,`Engagements : ${shots}`);assert.ok(held>60,`Occupation du point : ${held}`);assert.ok(ctx.noises.length<=80);
});
