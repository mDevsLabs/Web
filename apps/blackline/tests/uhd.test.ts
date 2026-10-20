import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {renderDimensions,graphicsPreset} from '../src/graphics-policy.ts';
import {renderBudget} from '../src/input.ts';
import {normalizeSettings} from '../src/settings-normalize.ts';
import {DEFAULT_SETTINGS} from '../src/types.ts';
import {targetFPS} from '../src/game/performance-policy.ts';
import {FramePacer} from '../src/game/frame-pacer.ts';
import {UltraBloomPass} from '../src/render/ultra-bloom.ts';
import {ultraOutputShader} from '../src/render/ultra-output.ts';
import {environmentMaps} from '../src/render/environment-surfaces.ts';
import {generateSurface} from '../src/render/surface-generator.ts';
import {settingsMarkup} from '../src/ui/settings.ts';
import {normalizeSave} from '../lib/server/validation.js';
const budget=renderBudget('ultra',false),limits={maxTextureSize:16384,maxRenderbufferSize:16384,maxViewportWidth:16384,maxViewportHeight:16384};
test('8K suréchantillonne réellement la scène en 7680 × 4320 même sur une fenêtre 1080p',()=>{
 const r=renderDimensions(1920,1080,1,budget,'8k',limits);assert.equal(r.width,7680);assert.equal(r.height,4320);assert.equal(r.ratio,4);assert.equal(r.limited,false);
 const four=renderDimensions(1920,1080,1,budget,'4k',limits);assert.deepEqual([four.width,four.height],[3840,2160]);
});
test('les résolutions UHD conservent le format et respectent les trois limites matérielles',()=>{
 for(const [w,h] of [[3440,1440],[390,844],[1024,768],[1920,1080]])for(const caps of [limits,{...limits,maxTextureSize:4096},{...limits,maxRenderbufferSize:2048},{...limits,maxViewportHeight:1024}]){
  const r=renderDimensions(w,h,2,budget,'8k',caps);
  assert.ok(r.width<=Math.min(caps.maxTextureSize,caps.maxRenderbufferSize,caps.maxViewportWidth));assert.ok(r.height<=Math.min(caps.maxTextureSize,caps.maxRenderbufferSize,caps.maxViewportHeight));
  assert.ok(r.width*r.height<=7680*4320);assert.ok(Math.abs(r.width/r.height-w/h)<.004);
 }
 const limited=renderDimensions(1920,1080,1,budget,'8k',{...limits,maxRenderbufferSize:4096});assert.equal(limited.limited,true);assert.deepEqual([limited.width,limited.height],[4096,2304]);
});
test('le mode Auto conserve les budgets mobiles et seule l’adaptation explicite réduit la définition',()=>{
 for(const mobile of [true,false]){const b=renderBudget('ultra',mobile);const a=renderDimensions(1920,1080,3,b,'auto',limits);assert.ok(a.width*a.height<=b.pixels);assert.ok(a.ratio<=b.ratio);}
 const a=renderDimensions(1920,1080,1,budget,'8k',limits,.5);assert.deepEqual([a.width,a.height],[3840,2160]);assert.equal(a.limited,false);
 assert.deepEqual([renderDimensions(1000,500,2,budget,'native',limits).width,renderDimensions(1000,500,2,budget,'native',limits).height],[2000,1000]);
});
test('les profils Ultra sont sauvegardables et l’économie ne baisse jamais les matériaux',()=>{
 for(const id of ['smooth','4k','uhd']){const s=normalizeSettings({...DEFAULT_SETTINGS,...graphicsPreset(id)});assert.equal(s.quality,'ultra');assert.equal(s.adaptive,false);assert.equal(targetFPS('playing',s),120);const save=normalizeSave({settings:s});assert.equal(save.settings.renderResolution,s.renderResolution);}
 const s=normalizeSettings({...DEFAULT_SETTINGS,renderResolution:'8k',batterySaver:true});assert.equal(s.renderResolution,'8k');assert.equal(targetFPS('playing',s),30);
 assert.equal(normalizeSettings({...DEFAULT_SETTINGS,renderResolution:'32k',fpsLimit:999}).renderResolution,'auto');assert.equal('fpsLimit' in normalizeSettings({...DEFAULT_SETTINGS,fpsLimit:999}),false);
 assert.equal(normalizeSettings({},true).batterySaver,true);
});
test('le cadenceur atteint la cible 120 seulement quand le rafraîchissement le permet',()=>{
 for(const refresh of [60,90,120,144,165,240])for(const target of [30,60,90,120]){const pacer=new FramePacer();let frames=0;for(let i=0;i<refresh*10;i++){const now=i*1000/refresh;if(pacer.due(now,target)){pacer.rendered(now);frames++;}}assert.ok(Math.abs(frames-Math.min(refresh,target)*10)<=1,`${refresh}Hz / ${target}FPS : ${frames}`);}
});
test('le bloom 8K garde ses cinq niveaux sans dépasser le tampon lumineux 960 × 540',()=>{
 const pass=new UltraBloomPass(new T.Vector2(256,256),.16,.62,1.08);pass.setSize(7680,4320);assert.equal(pass.renderTargetBright.width,960);assert.equal(pass.renderTargetBright.height,540);assert.equal(pass.renderTargetsHorizontal.length,5);const count=[pass.renderTargetBright,...pass.renderTargetsHorizontal,...pass.renderTargetsVertical].reduce((n,t)=>n+t.width*t.height,0);assert.ok(count<2_000_000);pass.setSize(844,390);assert.equal(pass.renderTargetBright.width,422);pass.dispose();
});
test('l’étalonnage et l’anticrénelage partagent une passe sRGB sans grain opaque',()=>{
 assert.ok(ultraOutputShader.fragmentShader.includes('vec4 aa=ApplyFXAA'));assert.ok(ultraOutputShader.fragmentShader.includes('gl_FragColor=vec4(c,aa.a)'));assert.ok(!ultraOutputShader.fragmentShader.includes('43758.5453'));assert.equal(ultraOutputShader.uniforms.strength.value,0);
 const ui=settingsMarkup({...DEFAULT_SETTINGS,renderResolution:'8k'},false,false,'7680 × 4320');assert.ok(ui.includes('data-graphics="uhd"'));assert.ok(ui.includes('value="8k" selected'));assert.ok(!ui.includes('id="fpsLimit"'));assert.ok(ui.includes('cadence suit l’écran'));
});
test('les nouvelles surfaces PBR sont stables, mipmappées et les normales gardent une longueur unitaire',()=>{
 for(const kind of ['masonry','asphalt','bark','sand'] as const){const maps=environmentMaps(kind);assert.equal(maps,environmentMaps(kind));assert.equal(maps.color.image.width,512);assert.equal(maps.color.colorSpace,T.SRGBColorSpace);assert.equal(maps.normal.colorSpace,T.NoColorSpace);for(const t of Object.values(maps)){assert.ok(t.generateMipmaps);assert.equal(t.wrapS,T.RepeatWrapping);}const bytes=maps.normal.image.data as Uint8Array;for(let i=0;i<bytes.length;i+=4096){const n=Math.hypot(bytes[i]/255*2-1,bytes[i+1]/255*2-1,bytes[i+2]/255*2-1);assert.ok(Math.abs(n-1)<.015);}}
 const a=generateSurface('metal'),b=generateSurface('metal');assert.equal(a.size,256);assert.deepEqual(a.normal,b.normal);assert.deepEqual(a.roughness,b.roughness);
});
