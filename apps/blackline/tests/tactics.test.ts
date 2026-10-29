import test from 'node:test';
import assert from 'node:assert/strict';
import { BotBrain, createActor } from '../src/ai.ts';
import type { AIContext } from '../src/ai.ts';
import { chooseCover, choosePeek, escapeGrenade, friendlyInLine, shotDistance } from '../src/tactics.ts';
import { createMap } from '../src/maps.ts';
import { WEAPONS } from '../src/types.ts';
import { Navigation } from '../src/navigation.ts';
import { circleBlocked, distance, visible } from '../src/math.ts';

function arena(wall=false){const map=createMap('harbor');map.props=wall?[{kind:'wall',x:0,z:0,w:2,d:6,h:3}]:[];return map;}
test('un allié dans la trajectoire bloque le tir, mais pas un allié mort, éloigné ou derrière la cible',()=>{
  const a=createActor(1,'A',0,WEAPONS[0]),b=createActor(2,'B',1,WEAPONS[0]),ally=createActor(3,'C',0,WEAPONS[0]);a.x=-8;b.x=8;ally.x=0;
  assert.equal(friendlyInLine(a,b,[a,b,ally]),true);ally.z=1;assert.equal(friendlyInLine(a,b,[a,b,ally]),false);ally.z=0;ally.alive=false;assert.equal(friendlyInLine(a,b,[a,b,ally]),false);ally.alive=true;ally.x=12;assert.equal(friendlyInLine(a,b,[a,b,ally]),false);
});
test('le bot diffère effectivement son tir quand un allié le masque',()=>{
  const map=arena(),a=createActor(2,'A',0,WEAPONS[0]),b=createActor(4,'B',1,WEAPONS[0]),ally=createActor(1,'C',0,WEAPONS[0]);b.z=-16;ally.z=-8;a.protectedTime=b.protectedTime=0;
  const brain=new BotBrain(a,'regular',map);brain.target=b;brain.state='engage';brain.nextThink=Infinity;let shots=0;
  const ctx:AIContext={time:1,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a,b,ally],objectives:[],mode:'tdm',noises:[],shoot:()=>shots++};
  brain.step(.02,ctx);assert.equal(shots,0);ally.alive=false;ctx.time+=.02;brain.step(.02,ctx);assert.equal(shots,1);
});
test('les rafales ont une pause distincte entre deux groupes de tirs',()=>{
  const map=arena(),a=createActor(2,'A',0,WEAPONS[0]),b=createActor(4,'B',1,WEAPONS[0]);b.z=-18;a.protectedTime=b.protectedTime=0;
  const brain=new BotBrain(a,'regular',map),shots:number[]=[],ctx:AIContext={time:0,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a,b],objectives:[],mode:'tdm',noises:[],shoot:actor=>{shots.push(ctx.time);actor.ammo--;}};
  for(let i=0;i<240;i++){ctx.time=i/60;brain.step(1/60,ctx);}assert.ok(shots.length>=6);assert.ok(shots.some((t,i)=>i>0&&t-shots[i-1]>.3));assert.ok(shots.length<4/a.weapon.fireInterval);
});
test('la suppression traite deux balles simultanées une fois chacune et respecte la longueur bloquée du tir',()=>{
  const map=arena(),a=createActor(2,'A',0,WEAPONS[0]),brain=new BotBrain(a,'regular',map),shot={x:0,y:1.6,z:-20,team:1 as const,time:1,direction:{x:0,y:0,z:1},length:20};
  const ctx:AIContext={time:1,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a],objectives:[],mode:'tdm',noises:[{...shot},{...shot}],shoot:()=>{}};
  brain.perceive(ctx);assert.equal(brain.suppression,.8);brain.perceive(ctx);assert.equal(brain.suppression,.8);
  assert.ok(shotDistance({x:0,y:1.4,z:0},{...shot,length:10})>10);assert.ok(shotDistance({x:0,y:1.4,z:0},shot)<.3);
});
test('les couverts sont vraiment occultés et l’occupation par les alliés modifie le choix',()=>{
  const map=arena(true),a=createActor(1,'A',0,WEAPONS[0]),ally=createActor(2,'C',0,WEAPONS[0]);a.x=-4;ally.x=-3;
  const threat={x:5,z:0},near={x:-3,z:0},other={x:-3,z:-3},exposed={x:-3,z:8};
  assert.deepEqual(chooseCover(a,threat,[near,other,exposed],map,[a]),near);
  assert.deepEqual(chooseCover(a,threat,[near,other,exposed],map,[a,ally]),other);
  const peek=choosePeek({x:-2,z:2.8},threat,map,-1);assert.ok(peek);assert.equal(circleBlocked(peek,.45,map.props),false);assert.equal(visible({...peek,y:1.55},{...threat,y:1.5},map.props),true);
});
test('les grenades déclenchent une fuite vers une case libre ; une grenade distante et masquée ne donne pas d’information',()=>{
  const map=arena(true),a=createActor(1,'A',0,WEAPONS[0]);a.x=-4;const brain=new BotBrain(a,'regular',map);
  const ctx:AIContext={time:3,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a],objectives:[],mode:'tdm',noises:[],shoot:()=>{},hazards:[{position:{x:4,y:.15,z:0},remaining:1,team:1}]};
  brain.chooseGoal(ctx);assert.notEqual(brain.state,'evade');ctx.hazards=[{position:{x:-2,y:.15,z:0},remaining:1,team:1}];brain.chooseGoal(ctx);
  assert.equal(brain.state,'evade');assert.ok(brain.goal);assert.equal(circleBlocked(brain.goal,.45,map.props),false);assert.ok(distance(brain.goal,ctx.hazards[0].position)>8);
  const escape=escapeGrenade(a,ctx.hazards[0].position,map);assert.ok(escape);assert.ok(Math.abs(escape.x)<map.width/2&&Math.abs(escape.z)<map.depth/2);
});
test('les signalements d’escouade et la survie ne lisent pas la position actuelle d’un ennemi invisible',()=>{
  const map=arena(true),a=createActor(1,'A',0,WEAPONS[0]),b=createActor(2,'PLAYER',1,WEAPONS[0],true);a.x=-4;b.x=20;a.yaw=-Math.PI/2;b.protectedTime=0;
  const brain=new BotBrain(a,'regular',map),ctx:AIContext={time:2,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a,b],objectives:[],mode:'tdm',noises:[],intel:[new Map([[b.id,{position:{x:4,z:0},time:1}]]),new Map()],shoot:()=>assert.fail('Pas de tir à travers le mur')};
  brain.perceive(ctx);assert.equal(brain.target,null);assert.deepEqual(brain.lastKnown,{x:4,z:0});b.x=30;brain.chooseGoal(ctx);assert.deepEqual(brain.goal,{x:4,z:0});
  const hunter=createActor(3,'HUNTER',1,WEAPONS[0]),hidden=createActor(0,'PLAYER',0,WEAPONS[0],true),hunt=new BotBrain(hunter,'regular',map);hunter.x=4;hidden.x=-27;hidden.z=18;
  const survival={...ctx,mode:'survival',actors:[hunter,hidden],intel:undefined};hunt.chooseGoal(survival);assert.notDeepEqual(hunt.goal,{x:hidden.x,z:hidden.z});
});
test('un chemin impossible n’est pas recalculé à chaque image',()=>{
  const map=arena(),a=createActor(1,'A',0,WEAPONS[0]),brain=new BotBrain(a,'regular',map);brain.goal={x:20,z:0};brain.nextThink=Infinity;const nav=new Navigation(map.width,map.depth,map.props);let calls=0;nav.path=()=>{calls++;return [];};
  const ctx:AIContext={time:0,map,nav,actors:[a],objectives:[],mode:'tdm',noises:[],shoot:()=>{}};for(let i=0;i<120;i++){ctx.time=i/120;brain.step(1/120,ctx);}assert.equal(calls,1);
});
test('le rechargement préventif garde une comptabilité correcte des munitions',()=>{
  const map=arena(),a=createActor(1,'A',0,WEAPONS[0]);a.ammo=3;a.reserve=50;const brain=new BotBrain(a,'regular',map);brain.nextThink=0;
  const ctx:AIContext={time:0,map,nav:new Navigation(map.width,map.depth,map.props),actors:[a],objectives:[],mode:'tdm',noises:[],shoot:()=>assert.fail('Pas d’ennemi')};
  brain.step(.01,ctx);assert.equal(a.ammo,3);assert.equal(a.reloadTime,a.weapon.reload);
  for(let i=1;i<170;i++){ctx.time=i/60;brain.step(1/60,ctx);}assert.equal(a.ammo,30);assert.equal(a.reserve,23);assert.equal(a.reloadTime,0);
});
