import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SHOP_ITEMS, equipItem, normalizeCollection, ownsWeapon, purchase, wallet } from '../lib/game/shop-catalog.js';
import { Game } from '../src/game.ts';
import { createActor,BotBrain } from '../src/ai.ts';
import { traceShot,reticleEnemy } from '../src/game/targeting.ts';
import { simulationSlices } from '../src/game/timing.ts';
import { steerCrowd } from '../src/npc-steering.ts';
import { DEFAULT_SETTINGS,WEAPONS,weaponById } from '../src/types.ts';
import { normalizeProfile } from '../src/storage.ts';
import { normalizeProgress } from '../src/progression.ts';
import { createMap } from '../src/maps.ts';
import { Navigation } from '../src/navigation.ts';
import { TouchInput } from '../src/input.ts';
import { createWeapon } from '../src/world.ts';
import { shopMarkup } from '../src/ui/pages/shop.ts';
import { guideMarkup } from '../src/ui/pages/guide.ts';
import { normalizeSettings } from '../src/settings-normalize.ts';
import { bounded,loadingProgress } from '../src/preload.ts';
import { Effects } from '../src/effects.ts';
import { UI } from '../src/ui.ts';
function combatFixture(){const player=createActor(0,'P',0,WEAPONS[0],true),map={...createMap('harbor'),props:[]},gun=createWeapon(player.weapon,true),gunScene=new T.Scene();gunScene.add(gun);let fired=0;
  const game=Object.assign(Object.create(Game.prototype),{mobile:true,state:'playing',player,actors:[player],progress:normalizeProgress({}),collection:normalizeCollection({}),inventory:new Map(),gun,gunScene,gunCamera:new T.PerspectiveCamera(64),camera:new T.PerspectiveCamera(84),touch:new TouchInput(),keys:new Set(),settings:{...DEFAULT_SETTINGS,cameraShake:false},world:{map},time:0,
    slideTime:0,slideCooldown:0,slideDir:{x:0,z:0},stamina:100,velocityY:0,grounded:true,eyeHeight:1.63,walkTime:0,stepTime:0,aimAmount:0,aimDown:false,recoil:0,mouseX:0,mouseY:0,mouseDown:false,shots:0,shotPulse:0,viewKick:0,reloadStage:0,noises:[],audio:{footstep(){},reload(){},reloadStep(){},hit(){},shot(){}},hooks:{event(){}},shoot(){fired++;}}) as Game;
  return {game,player,map,get fired(){return fired;}};
}
test('la boutique débite une seule fois, refuse les fonds insuffisants et conserve l’équipement acheté',()=>{
 const profile=normalizeProfile({xp:2400});assert.equal(wallet(profile),1000);assert.equal(purchase(profile,'weapon-shotgun').ok,true);assert.equal(wallet(profile),250);assert.equal(purchase(profile,'weapon-shotgun').ok,false);assert.equal(wallet(profile),250);assert.equal(purchase(profile,'weapon-lmg').ok,false);assert.equal(equipItem(profile,'weapon-shotgun'),true);assert.equal(profile.weapon,'shotgun');const loaded=normalizeProfile(JSON.parse(JSON.stringify(profile)));assert.equal(ownsWeapon(loaded.collection,'shotgun'),true);assert.equal(wallet(loaded),250);assert.equal(loaded.weapon,'shotgun');
});
test('les achats inconnus, doublons et équipements non possédés sont filtrés des sauvegardes',()=>{
 const profile=normalizeProfile({xp:0,weapon:'lmg',collection:{purchases:['bad','shot-ion','shot-ion','weapon-lmg'],shot:'violet',kill:'pulse'}});assert.deepEqual(profile.collection?.purchases,['shot-ion']);assert.equal(wallet(profile),100);assert.equal(profile.collection?.shot,'standard');assert.equal(profile.weapon,'ar');assert.equal(equipItem(profile,'weapon-lmg'),false);
});
test('la boutique expose tous ses articles et le guide respecte les touches personnalisées',()=>{
 const profile=normalizeProfile({});assert.equal((shopMarkup(profile).match(/data-buy=/g)??[]).length,SHOP_ITEMS.length);assert.equal((shopMarkup(profile,'weapons').match(/data-buy=/g)??[]).length,4);assert.equal((guideMarkup(profile,DEFAULT_SETTINGS,true).match(/data-guide-step=/g)??[]).length,8);assert.ok(guideMarkup(profile,DEFAULT_SETTINGS,true).includes('paysage'));const mobileSettings=normalizeSettings(DEFAULT_SETTINGS,true);assert.equal(mobileSettings.mobileAutoFire,true);assert.equal(mobileSettings.toggleAim,false);assert.equal(normalizeSettings({...DEFAULT_SETTINGS,toggleAim:true},false).toggleAim,true);
});
test('un ennemi sous le réticule déclenche le tir mobile, mais un mur, un allié ou le réglage désactivé le bloquent',()=>{
 const fixture=combatFixture(),{game,player,map}=fixture,enemy=createActor(1,'E',1,WEAPONS[0]);enemy.z=-8;enemy.protectedTime=0;game.actors.push(enemy);player.fireTime=0;game.updatePlayer(1/60);assert.equal(fixture.fired,1);
 player.fireTime=0;map.props.push({kind:'wall',x:0,y:0,z:-4,w:4,h:4,d:1});game.updatePlayer(1/60);assert.equal(fixture.fired,1);map.props=[];const ally=createActor(2,'A',0,WEAPONS[0]);ally.z=-4;game.actors.push(ally);player.fireTime=0;game.updatePlayer(1/60);assert.equal(fixture.fired,1);game.actors.pop();game.settings.mobileAutoFire=false;game.updatePlayer(1/60);assert.equal(fixture.fired,1);
 game.settings.mobileAutoFire=true;enemy.protectedTime=3;game.updatePlayer(1/60);assert.equal(fixture.fired,1);
});
test('le tir automatique tient compte de la hauteur réelle des cibles',()=>{
 const p=createActor(0,'P',0,WEAPONS[0],true),enemy=createActor(1,'E',1,WEAPONS[0]);enemy.z=-8;enemy.y=6;enemy.protectedTime=0;assert.equal(reticleEnemy(p,[p,enemy],[],{x:0,y:1.63,z:0}),null);p.pitch=Math.atan2(6,8);assert.equal(reticleEnemy(p,[p,enemy],[],{x:0,y:1.63,z:0}),enemy);
});
test('une arme verrouillée ne peut pas être équipée en appelant directement le moteur',()=>{
 const {game,player}=combatFixture();game.switchWeapon('lmg');assert.equal(player.weapon.id,'ar');game.collection=normalizeCollection({purchases:['weapon-lmg']},5000);game.switchWeapon('lmg');assert.equal(player.weapon.id,'lmg');assert.equal(game.gun.userData.weaponId,'lmg');
});
test('le SG-8 consomme une cartouche, produit six trajectoires et compte une touche au maximum par tir',()=>{
 const f=combatFixture(),{game,player}=f;player.weapon=weaponById('shotgun');player.ammo=8;player.yaw=0;const enemy=createActor(1,'E',1,WEAPONS[0]);enemy.z=-3;enemy.protectedTime=0;game.actors.push(enemy);let rays=0,hits=0;game.effects={shot(){rays++;},impact(){},eject(){}} as any;game.audio.shot=()=>{};game.audio.hit=()=>{};game.hits=0;game.awardXP=()=>{};game.damage=()=>{hits++;};Game.prototype.shoot.call(game,player,{x:0,y:0,z:-1});assert.equal(player.ammo,7);assert.equal(rays,6);assert.ok(hits>0);assert.equal(game.hits,1);assert.equal(game.noises.length,1);
});
test('une mauvaise fréquence d’affichage ne ralentit plus les secondes simulées, et les sous-pas restent bornés',()=>{
 for(const fps of [10,20,30,60,120]){const slices=simulationSlices(1/fps);assert.ok(slices.every(t=>t<=1/60+1e-12));assert.ok(Math.abs(slices.reduce((a,b)=>a+b,0)-1/fps)<1e-10);}assert.equal(simulationSlices(NaN).length,0);assert.ok(simulationSlices(30).reduce((a,b)=>a+b,0)<=.100001);
});
test('les PNJ évitent leurs camarades au même étage sans être repoussés par un joueur sur le toit',()=>{
 const p=createActor(1,'A',0,WEAPONS[0]),buddy=createActor(2,'B',0,WEAPONS[0]);buddy.z=-1;const steered=steerCrowd(p,0,-1,[p,buddy]);assert.notEqual(steered.x,0);buddy.y=6;assert.deepEqual(steerCrowd(p,0,-1,[p,buddy]),{x:0,z:-1});
});
test('un PNJ ne suit plus l’angle courant d’une cible qui vient de passer derrière un mur',()=>{
 const map=createMap('harbor');map.props=[{kind:'wall',x:0,z:-5,w:8,d:1,h:4}];const a=createActor(1,'A',0,WEAPONS[0]),t=createActor(2,'T',1,WEAPONS[0]),brain=new BotBrain(a,'regular',map);t.z=-10;t.protectedTime=0;brain.target=t;brain.lastKnown={x:0,z:-10};brain.nextThink=100;brain.step(.01,{time:1,map,actors:[a,t],nav:new Navigation(map.width,map.depth,map.props),objectives:[],noises:[],mode:'tdm',shoot:()=>assert.fail('cible cachée')});assert.equal(brain.target,null);assert.deepEqual(brain.lastKnown,{x:0,z:-10});
});
test('les effets de tir sont isolés entre les projectiles et les ondes restent à la hauteur d’un toit',()=>{
 const effects=new Effects(new T.Scene(),100);effects.shot({x:0,y:1,z:0},{x:0,y:1,z:-8},true,'ar','ion');effects.shot({x:0,y:1,z:0},{x:0,y:1,z:-8},false,'ar');assert.equal((effects.tracers[0].mesh.material as T.MeshBasicMaterial).color.getHex(),0x77deed);assert.equal((effects.tracers[1].mesh.material as T.MeshBasicMaterial).color.getHex(),0xffd9a2);effects.explosion({x:0,y:6,z:0});assert.ok(effects.waves[0].mesh.position.y>5);effects.elimination({x:0,y:7,z:0});assert.ok(effects.waves[1].mesh.position.y>7);
});
test('le préchargement progresse sans reculer et un shader bloqué ne bloque pas le jeu indéfiniment',async()=>{
 const values:number[]=[],report=loadingProgress(v=>values.push(v));report(15,'A');report(10,'B');report(120,'C');assert.deepEqual(values,[15,15,100]);assert.equal(await bounded(Promise.resolve(7),100),7);assert.equal(await bounded(new Promise(()=>{}),2),undefined);
});
test('les six armes disposent de modèles distincts et d’une optique libre après fusion',()=>{
 for(const w of WEAPONS){const gun=createWeapon(w,true);assert.equal(gun.userData.weaponId,w.id);const p=gun.userData.muzzle as T.Vector3;assert.ok(p.z<-.35);assert.ok(gun.getObjectByName('magazine'));}
});
test('un lancer près d’un mur ne fait pas apparaître la grenade de l’autre côté',()=>{
 const {game,player,map}=combatFixture();player.z=0;game.grenadeCount=2;game.grenades=[];game.scene=new T.Scene();game.audio.burst=()=>{};map.props=[{kind:'wall',x:0,z:-.65,w:3,d:.5,h:4}];game.throwGrenade();assert.equal(game.grenades.length,1);assert.ok(game.grenades[0].mesh.position.z>-.4);assert.equal(game.grenadeCount,1);
});
test('les grenades et la mêlée ne font pas monter le niveau de l’arme tenue',()=>{
 const {game,player}=combatFixture(),enemy=createActor(2,'E',1,WEAPONS[0]);enemy.protectedTime=0;enemy.hp=1;game.actors.push(enemy);game.time=1;game.score=[0,0];game.config={mode:'tdm',map:'harbor',difficulty:'regular',bots:7,weapon:'ar',duration:180};game.playerScore=0;game.streak=0;game.bestStreak=0;game.audio.kill=()=>{};game.awardXP=()=>assert.fail('Aucun XP d’arme pour une grenade');game.damage(enemy,10,player,false,'grenade');assert.equal(enemy.alive,false);assert.equal(player.kills,1);
});
test('le préchargement réutilise le modèle actif au lieu de créer un doublon dans le cache',async()=>{
 const {game}=combatFixture(),active=game.gun,old=(globalThis as any).requestAnimationFrame;game.scene=new T.Scene();game.gunCache=new Map();game.renderer={compileAsync:async()=>{}} as any;(globalThis as any).requestAnimationFrame=(callback:()=>void)=>{callback();return 1;};try{const values:number[]=[];await game.warmup(v=>values.push(v));assert.equal(game.gunCache.get('ar:factory'),active);assert.equal(game.gunCache.size,4);assert.equal(values.at(-1),1);}finally{(globalThis as any).requestAnimationFrame=old;}
});
