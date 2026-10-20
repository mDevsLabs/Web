import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { normalizeProgress, awardWeaponXP, toggleUpgrade, upgradedWeapon, weaponLevel } from '../src/progression.ts';
import { DEFAULT_BINDINGS, normalizeBindings, bindKey, pressed, matches } from '../src/keybindings.ts';
import { WEAPONS, DEFAULT_SETTINGS } from '../src/types.ts';
import { Game } from '../src/game.ts';
import { TouchInput } from '../src/input.ts';
import { createActor } from '../src/ai.ts';
import { createWeapon } from '../src/world.ts';
import { opticCenter } from '../src/optics.ts';
import { arsenalMarkup } from '../src/ui/arsenal.ts';
import { settingsMarkup } from '../src/ui/settings.ts';
import { weaponGraphic } from '../src/ui/weapon-graphic.ts';
test('chaque arme progresse séparément et les accessoires modifient les statistiques sans modifier le catalogue',()=>{
  const book=normalizeProgress({});awardWeaponXP(book,'pistol',1200,true,true);assert.equal(weaponLevel(book.pistol.xp),2);assert.equal(book.pistol.kills,1);assert.equal(book.pistol.headshots,1);assert.equal(book.ar.xp,0);
  assert.equal(toggleUpgrade(book,'pistol','match-barrel'),false);assert.equal(toggleUpgrade(book,'pistol','stabilizer'),true);
  const base=WEAPONS.find(w=>w.id==='pistol')!,improved=upgradedWeapon(base,book.pistol);assert.ok(improved.spread<base.spread);assert.ok(improved.recoil<base.recoil);assert.equal(base.spread,.007);
  awardWeaponXP(book,'pistol',10000);assert.equal(toggleUpgrade(book,'pistol','fast-mag'),true);assert.ok(upgradedWeapon(base,book.pistol).reload<base.reload);
});
test('les anciennes sauvegardes ont quatre armes et les niveaux frauduleux ou accessoires verrouillés sont ignorés',()=>{
  const book=normalizeProgress({ar:{xp:-9,kills:-10,equipped:['match-barrel']}});assert.equal(Object.keys(book).length,WEAPONS.length);assert.equal(book.ar.xp,0);assert.deepEqual(book.ar.equipped,[]);assert.equal(weaponLevel(10000000),200);
});
test('les touches personnalisées remplacent les anciennes touches et refusent les conflits',()=>{
  const bindings=normalizeBindings(DEFAULT_BINDINGS);assert.equal(bindKey(bindings,'jump','KeyT'),null);assert.equal(pressed(new Set(['Space']),'jump',bindings),false);assert.equal(pressed(new Set(['KeyT']),'jump',bindings),true);assert.equal(matches('KeyT','jump',bindings),true);
  assert.ok(bindKey(bindings,'reload','KeyT'));assert.ok(bindKey(bindings,'jump','Escape'));assert.equal(bindings.reload[0],'KeyR');
});
test('l’arsenal expose le pistolet, des dessins distincts et trois accessoires verrouillés au premier niveau',()=>{
  const html=arsenalMarkup('pistol',normalizeProgress({}),false);assert.ok(html.includes('P-12 WARDEN'));assert.equal((html.match(/data-weapon=/g)??[]).length,WEAPONS.length);assert.equal((html.match(/data-upgrade=/g)??[]).length,3);assert.equal((html.match(/data-upgrade="[^"]+" disabled/g)??[]).length,3);assert.equal((html.match(/data-skin=/g)??[]).length,4);
  assert.notEqual(weaponGraphic('pistol'),weaponGraphic('ar'));assert.notEqual(weaponGraphic('smg'),weaponGraphic('dmr'));
  const settings=settingsMarkup(DEFAULT_SETTINGS,false,false,'1280 × 720');assert.ok(settings.includes('data-bind="weapon4"'));assert.ok(settings.includes('id="reticleStyle"'));
});
test('le réticule projeté s’aligne au centre de l’optique quand l’arme vise, y compris au pistolet',()=>{
  for(const w of WEAPONS){const gun=createWeapon(w,true);gun.position.set(0,-((w.model??w.id)==='dmr'?.21:w.id==='pistol'?.16:.23),-.4);const camera=new T.PerspectiveCamera(54,16/9,.02,8),point=opticCenter(gun,camera,w);assert.ok(Math.abs(point.x)<1e-10);assert.ok(Math.abs(point.y)<1e-10);assert.ok(Number.isFinite(point.z));}
});
test('l’emplacement tactile 4 équipe le pistolet et conserve ses munitions au changement d’arme',()=>{
  const player=createActor(0,'TEST',0,WEAPONS[0],true),gun=createWeapon(player.weapon,true),scene=new T.Scene();scene.add(gun);
  const game=Object.assign(Object.create(Game.prototype),{state:'playing',player,mobile:true,touch:new TouchInput(),progress:normalizeProgress({}),inventory:new Map(),gun,gunScene:scene,gunCache:new Map(),recoil:0}) as Game;
  game.touchAction('weapon-4');assert.equal(player.weapon.id,'pistol');player.ammo=3;game.touchAction('weapon-1');game.touchAction('weapon-4');assert.equal(player.ammo,3);assert.ok(game.gun.getObjectByName('magazine'));assert.ok(game.gunCache.size<=4);
});
