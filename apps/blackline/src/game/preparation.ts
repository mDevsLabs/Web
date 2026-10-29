import * as T from 'three';
import { normalizeCareer } from '../../lib/game/career.js';
import type { Game } from '../game.ts';
import { compileStage,nextPaint,nextTask } from '../preload.ts';
import { WEAPONS } from '../types.ts';
import { createSoldier,createWeapon,disposeModel } from '../world.ts';
function textures(scene:T.Object3D){const found=new Set<T.Texture>();scene.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value instanceof T.Texture&&!value.isRenderTargetTexture)found.add(value);});return [...found];}
export async function warmup(this:Game,progress:(value:number,label:string)=>void=()=>{}){
  this.career??=normalizeCareer({});const equipped=WEAPONS.filter(w=>this.career.loadout.includes(w.id));
  const preview=new T.Scene();preview.environment=this.scene.environment;for(const object of this.gunScene.children)if(object instanceof T.Light)preview.add(object.clone());
  for(const w of equipped){await nextTask();const skin=this.progress[w.id]?.skin??'factory',key=w.id+':'+skin;let gun=this.gunCache.get(key);if(!gun){gun=this.gun.userData.weaponId===w.id&&this.gun.userData.skin===skin?this.gun:createWeapon(w,true,skin);this.gunCache.set(key,gun);}const clone=gun.clone(true);clone.getObjectByName('muzzle-flash')?.traverse(o=>o.visible=true);clone.visible=true;preview.add(clone);}
  progress(.2,'ARMES ÉQUIPÉES PRÉPARÉES');
  const samples=[createSoldier(0,equipped[0]??WEAPONS[0],this.career.appearance.self,this.progress[equipped[0]?.id]?.skin),createSoldier(1,WEAPONS[0],this.career.appearance.enemy)];
  for(const sample of samples){sample.root.position.set(10000,0,10000);this.scene.add(sample.root);}
  const pending=[...new Set([...textures(this.scene),...textures(preview)])];for(let i=0;i<pending.length;i++){this.renderer.initTexture?.(pending[i]);if(i%3===2)await nextTask();}progress(.4,'TEXTURES ULTRA PRÊTES');await nextPaint();
  const worldReady=await compileStage(()=>this.renderer.compileAsync(this.scene,this.camera),()=>{for(const sample of samples){this.scene.remove(sample.root);disposeModel(sample.root);}},3500);
  progress(.72,worldReady?'TERRAIN ET TENUES PRÉPARÉS':'PRÉPARATION GRAPHIQUE PARTIELLE');if(!worldReady){this.hooks?.event('notice',{text:'Préparation GPU partielle. Les shaders restants seront compilés à leur première utilisation.'});progress(1,'PRÊT · PRÉPARATION PARTIELLE');this.invalidate?.();return;}
  const gunsReady=await compileStage(()=>this.renderer.compileAsync(preview,this.gunCamera),()=>{preview.clear();},1500);
  if(!gunsReady)this.hooks?.event('notice',{text:'Préparation des optiques partielle. Le jeu reste disponible.'});progress(1,gunsReady?'PRÊT POUR L’OPÉRATION':'PRÊT · PRÉPARATION PARTIELLE');this.invalidate?.();
}
