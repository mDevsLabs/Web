import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeSave } from '../lib/server/validation.js';
import { SHOP_ITEMS } from '../lib/game/shop-catalog.js';
import { splitSQL } from '../lib/db/split-sql.js';
test('le serveur conserve la collection et les réglages mobiles, et refuse les armes non achetées',()=>{
 const save=normalizeSave({profile:{xp:5000,weapon:'shotgun',collection:{purchases:['weapon-shotgun','shot-ion'],shot:'ion'},guideStep:4,guideComplete:true},settings:{mobileAutoFire:false,mobileAimAssist:true,touchOpacity:.7,toggleAim:true}});assert.equal(save.profile.weapon,'shotgun');assert.equal(save.profile.collection.shot,'ion');assert.equal(save.profile.guideStep,4);assert.equal(save.settings.mobileAutoFire,false);assert.equal(save.settings.toggleAim,true);assert.ok(save.profile.weaponProgress.lmg);assert.equal(normalizeSave({profile:{weapon:'lmg'}}).profile.weapon,'ar');
});
test('la migration de boutique est versionnée, cohérente avec les prix du jeu et conserve les choix existants',()=>{
 const source=readFileSync(new URL('../lib/db/migrations/004_shop_mobile_and_guide.sql',import.meta.url),'utf8')+readFileSync(new URL('../lib/db/migrations/005_release_1_0.sql',import.meta.url),'utf8');assert.ok(splitSQL(source).length>=6);for(const item of SHOP_ITEMS)assert.ok(source.includes(`'${item.id}','${item.kind}','${item.target}','${item.name}',${item.price}`));assert.ok(source.includes("|| settings"));assert.ok(source.includes('guide_complete'));assert.ok(!/DROP|TRUNCATE/.test(source));
});
