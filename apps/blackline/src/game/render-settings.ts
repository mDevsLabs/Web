import * as T from 'three';
import type { Game } from '../game.ts';
import { setRootProperty,toggleRootClass } from '../root.ts';
import { effectiveQuality } from './performance-policy.ts';
import { renderBudget } from '../input.ts';
import { renderDimensions } from '../graphics-policy.ts';
import type { Settings } from '../types.ts';
export function applySettings(this:Game,settings:Settings){
  this.settings=settings;if(this.touch)this.touch.deadzone=settings.joystickDeadzone??.09;setRootProperty('--reticle-scale',String(settings.reticleScale??1));
  toggleRootClass('reduced-motion',settings.reduceMotion===true);
  toggleRootClass('no-screen-effects',settings.screenEffects===false);
  setRootProperty('--touch-opacity',String(settings.touchOpacity??.8));
  toggleRootClass('left-handed',settings.leftHanded===true);
  setRootProperty('--touch-scale',String(settings.touchScale??1));
  this.audio.setVolume(settings.volume);this.player.name=settings.callsign||'OPÉRATEUR';
  this.camera.fov=settings.fov;this.camera.updateProjectionMatrix();
  const budget=renderBudget(effectiveQuality(settings),this.mobile);
  this.renderer.shadowMap.enabled=budget.shadows>0;this.renderer.shadowMap.needsUpdate=true;
  this.bloom.enabled=budget.bloom;
  this.film.enabled=true;
  this.film.uniforms.strength.value=0; // Clean UHD image; grain obscures small enemies.
  this.film.uniforms.clarity.value=settings.quality==='ultra'?.16:settings.quality==='balanced'?.08:0;
  this.effects.setQuality(effectiveQuality(settings));this.world.setQuality(effectiveQuality(settings));
  this.adaptiveScale=1;this.slowTime=0;this.resize();
  this.world.root.traverse(o=>{if(o instanceof T.DirectionalLight&&o.castShadow){const size=budget.shadows||1024;if(o.shadow.mapSize.x!==size){o.shadow.mapSize.set(size,size);o.shadow.map?.dispose();o.shadow.map=null;o.shadow.needsUpdate=true;}}});
}
export function resize(this:Game){
  const viewport=window.visualViewport,w=Math.max(1,Math.round(viewport?.width??innerWidth)),h=Math.max(1,Math.round(viewport?.height??innerHeight));
  const budget=renderBudget(effectiveQuality(this.settings),this.mobile);
  const target=renderDimensions(w,h,window.devicePixelRatio??1,budget,this.settings.renderResolution??'auto',this.renderLimits,this.settings.adaptive?this.adaptiveScale:1);
  this.baseRatio=target.ratio;
  this.renderer.setPixelRatio(target.ratio);this.renderer.setSize(w,h,false);
  this.composer.setPixelRatio(target.ratio);this.composer.setSize(w,h);
  this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.gunCamera.aspect=w/h;this.gunCamera.updateProjectionMatrix();
  const size=this.renderer.getDrawingBufferSize(new T.Vector2());
  this.fxaa.uniforms.resolution.value.set(1/size.x,1/size.y);this.film.uniforms.texel.value.set(1/size.x,1/size.y);
  this.effects.setResolution(size.y);this.resolution=`${size.x} × ${size.y}${target.limited?' · limite GPU':''}`;
}
