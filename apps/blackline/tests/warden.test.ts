import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { aimFov,magnification } from '../src/aim-optics.ts';
import { WEAPONS,DEFAULT_SETTINGS } from '../src/types.ts';
import { Game } from '../src/game.ts';
import { portraitViewport,landscapeBlocked } from '../src/landscape.ts';
import { createWeapon } from '../src/world.ts';
import { createActor } from '../src/ai.ts';
import { normalizeProgress } from '../src/progression.ts';
import { skinMap } from '../src/skins.ts';
import { normalizeProfile } from '../src/storage.ts';
import { TouchInput } from '../src/input.ts';
const pistol=WEAPONS[3];
test('le grossissement du P-12 reste exactement ×1,1 pour tous les FOV et réglages de visée',()=>{
  for(const fov of [65,78,84,100,110])for(const scale of [.8,1,1.2])assert.ok(Math.abs(magnification(pistol,fov,scale)-1.1)<1e-12);
  assert.ok(aimFov(pistol,84)>70);assert.ok(magnification(WEAPONS[2],84)>2);
});
test('le portrait bloque le lancement et la reprise mobile, sans bloquer le PC',()=>{
  assert.equal(portraitViewport(true,390,844),true);assert.equal(portraitViewport(true,844,390),false);assert.equal(portraitViewport(false,390,844),false);
  const old=(globalThis as any).window;(globalThis as any).window={innerWidth:390,innerHeight:844};
  try{const game=Object.assign(Object.create(Game.prototype),{mobile:true,state:'paused',hooks:{event:()=>{}}}) as Game;game.resume();assert.equal(game.state,'paused');game.start({mode:'tdm',map:'harbor',difficulty:'regular',bots:7,weapon:'ar',duration:180});assert.equal(game.state,'paused');
    (globalThis as any).window={innerWidth:390,innerHeight:300,screen:{orientation:{type:'portrait-primary'}}};assert.equal(landscapeBlocked(true),true);
  }finally{(globalThis as any).window=old;}
});
test('recommencer avec une autre arme ne range pas le précédent modèle sous le mauvais identifiant',()=>{
  const player=createActor(0,'TEST',0,pistol,true),gun=createWeapon(WEAPONS[0],true),scene=new T.Scene();scene.add(gun);
  const game=Object.assign(Object.create(Game.prototype),{player,progress:normalizeProgress({}),inventory:new Map(),gun,gunScene:scene,gunCache:new Map()}) as Game;
  game.switchWeapon('pistol');assert.equal(game.gun.userData.weaponId,'pistol');assert.notEqual(game.gun,gun);game.switchWeapon('ar');assert.equal(game.gun,gun);game.switchWeapon('pistol');assert.equal(game.gun.userData.weaponId,'pistol');
  game.progress.pistol.skin='arctic';game.switchWeapon('pistol');assert.equal(game.gun.userData.skin,'arctic');assert.equal(game.gun.userData.weaponId,'pistol');
});
test('les skins restent isolés, les textures sont réutilisées et les finitions suivent les niveaux',()=>{
  const a=createWeapon(pistol,false,'arctic'),colors:number[]=[];a.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial)colors.push(o.material.color.getHex());});
  createWeapon(pistol,false,'ember');const after:number[]=[];a.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial)after.push(o.material.color.getHex());});assert.deepEqual(after,colors);assert.equal(a.userData.skin,'arctic');
  assert.equal(skinMap('night'),skinMap('night'));assert.notDeepEqual(skinMap('night').image.data,skinMap('arctic').image.data);
  assert.equal(normalizeProgress({pistol:{xp:0,skin:'night'}}).pistol.skin,'factory');assert.equal(normalizeProgress({pistol:{xp:14700,skin:'night'}}).pistol.skin,'night');
});
test('les compteurs locaux non finis sont rejetés et les anciennes sauvegardes restent compatibles',()=>{
  const p=normalizeProfile({xp:Infinity,kills:-2,deaths:2.8,matches:1e12});assert.equal(p.xp,0);assert.equal(p.kills,0);assert.equal(p.deaths,2);assert.equal(p.matches,10000000);assert.equal(Object.keys(p.weaponProgress??{}).length,WEAPONS.length);
});
test('une demande tardive de capture de souris ne vole pas le pointeur au menu',()=>{
  let exited=0;const old=(globalThis as any).document;(globalThis as any).document={exitPointerLock:()=>exited++};try{const game=Object.assign(Object.create(Game.prototype),{mobile:false,state:'menu',locked:false}) as Game;game.pointerLockChanged(true);assert.equal(game.locked,false);assert.equal(exited,1);}finally{(globalThis as any).document=old;}
});
test('la sortie d’échelle bloque le tir et conserve les munitions',()=>{
  const game=Object.assign(Object.create(Game.prototype),{state:'playing',player:createActor(0,'TEST',0,pistol,true),climbExit:{},shoot:()=>assert.fail('Aucun tir en sortant')}) as Game;const ammo=game.player.ammo;game.firePlayer();assert.equal(game.player.ammo,ammo);
});

test('le corps biseauté et le canon du pistolet restent présents après la fusion des géométries',()=>{
  for(const skin of ['factory','arctic','ember','night'] as const){const model=createWeapon(pistol,false,skin),body=model.children.find(o=>o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&o.material.map===skinMap(skin)) as T.Mesh;assert.ok(body,'Le corps texturé doit être présent à la racine');body.geometry.computeBoundingBox();assert.ok(body.geometry.boundingBox!.min.y<-.25,'La poignée doit être complète');const bounds=new T.Box3().setFromObject(model);assert.ok(bounds.min.z<-.39,'Le canon doit être présent');assert.ok(bounds.max.y>=.15,'L’optique reste présente');}
});
