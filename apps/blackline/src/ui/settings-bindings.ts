import type { KeyAction } from '../keybindings.ts';
import { DEFAULT_BINDINGS,bindKey,keyLabel,normalizeBindings } from '../keybindings.ts';
import { graphicsPreset } from '../graphics-policy.ts';
import { saveSettings } from '../storage.ts';
import type { UI } from '../ui.ts';
import { normalizeSettings } from '../settings-normalize.ts';
export function bindSettings(this:UI){
    const booleans=['adaptive','showFPS','autoSprint','invertY','leftHanded','mobileAutoFire','mobileAimAssist','toggleAim','screenEffects','batterySaver','autoClimb','autoReload'];
    const numbers=['fov','sensitivity','touchSensitivity','volume','adsZoom','touchScale','touchOpacity','grenadePower','cameraDistance','adsSensitivity','reticleScale','joystickDeadzone'];
    const keys=[...booleans,...numbers,'renderResolution','quality','crosshair','callsign','reticleStyle','cameraMode','cameraShoulder','motionLevel','hitFeedback'];
    const apply=()=>{Object.assign(this.settings,normalizeSettings(this.settings,this.mobile));saveSettings(this.settings);this.game?.applySettings(this.settings);const status=this.app.querySelector('#render-resolution');if(status&&this.game)status.textContent=this.game.resolution;for(const key of ['cameraShoulder','cameraDistance']){const e=this.app.querySelector<HTMLInputElement>('#'+key);if(e)e.disabled=this.settings.cameraMode!=='third';}};
    for(const key of keys){const e=this.app.querySelector<HTMLInputElement|HTMLSelectElement>('#'+key);if(!e)continue;e.oninput=()=>{
      (this.settings as unknown as Record<string,unknown>)[key]=booleans.includes(key)?(e as HTMLInputElement).checked:numbers.includes(key)?Number(e.value):e.value;
      const out=this.app.querySelector('#'+key+'-value');if(out)out.textContent=['volume','adsZoom','touchScale','touchOpacity','grenadePower','adsSensitivity','reticleScale','joystickDeadzone'].includes(key)?Math.round(Number(e.value)*100)+'%':key==='cameraDistance'?Number(e.value).toFixed(1)+' m':key==='fov'?e.value+'°':Number(e.value).toFixed(2);
      apply();
    };}
    this.app.querySelectorAll<HTMLButtonElement>('[data-graphics]').forEach(b=>b.onclick=()=>{Object.assign(this.settings,graphicsPreset(b.dataset.graphics!));apply();for(const key of ['quality','renderResolution']){const e=this.app.querySelector<HTMLSelectElement>('#'+key);if(e)e.value=String((this.settings as unknown as Record<string,unknown>)[key]);}const adaptive=this.app.querySelector<HTMLInputElement>('#adaptive');if(adaptive)adaptive.checked=this.settings.adaptive;});
    const reset=this.app.querySelector<HTMLButtonElement>('#settings-reset');if(reset)reset.onclick=()=>{Object.assign(this.settings,normalizeSettings({},this.mobile));apply();const screen=this.app.querySelector('.settings-screen');if(screen)screen.outerHTML=this.settingsPage();this.bindSettings();};
    const back=this.app.querySelector<HTMLButtonElement>('#return-settings');if(back)back.onclick=()=>{if(this.pausedSettings){this.pausedSettings=false;this.showPause();}else{this.screen='play';this.menu();}};
    for(const key of ['cameraShoulder','cameraDistance']){const e=this.app.querySelector<HTMLInputElement>('#'+key);if(e)e.disabled=this.settings.cameraMode!=='third';}
    this.bindKeys();
  }
export function bindKeys(this:UI){
    this.app.querySelectorAll<HTMLButtonElement>('[data-bind]').forEach(b=>b.onclick=()=>{this.bindingCapture?.abort();this.bindingCapture=new AbortController();b.textContent='APPUYEZ…';const action=b.dataset.bind as KeyAction;document.addEventListener('keydown',ev=>{ev.preventDefault();ev.stopImmediatePropagation();const binds=normalizeBindings(this.settings.bindings);if(ev.code!=='Escape'){const error=bindKey(binds,action,ev.code);if(error)this.notice(error);else{this.settings.bindings=binds;saveSettings(this.settings);this.game?.applySettings(this.settings);}}b.textContent=normalizeBindings(this.settings.bindings)[action].map(keyLabel).join(' / ');this.bindingCapture?.abort();},{capture:true,signal:this.bindingCapture.signal});});
    this.app.querySelectorAll<HTMLButtonElement>('[data-layout]').forEach(b=>b.onclick=()=>{const binds=structuredClone(DEFAULT_BINDINGS);if(b.dataset.layout==='qwerty'){binds.forward=['KeyW','ArrowUp'];binds.left=['KeyA','ArrowLeft'];}else if(b.dataset.layout==='azerty'){binds.forward=['KeyZ','ArrowUp'];binds.left=['KeyQ','ArrowLeft'];}this.settings.bindings=binds;saveSettings(this.settings);this.game?.applySettings(this.settings);for(const key of this.app.querySelectorAll<HTMLButtonElement>('[data-bind]'))key.textContent=binds[key.dataset.bind as KeyAction].map(keyLabel).join(' / ');});
  }