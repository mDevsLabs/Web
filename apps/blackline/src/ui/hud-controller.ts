import { normalizeCareer } from '../../lib/game/career.js';
import type { GameState,HUDData } from '../game.ts';
import { visible } from '../math.ts';
import { setRootProperty,toggleRootClass } from '../root.ts';
import { TouchControls } from '../touch-controls.ts';
import { weaponById } from '../types.ts';
import { hudMarkup } from '../ui/hud-markup.ts';
import { icon } from '../ui/icons.ts';
import * as hud_module from './hud-update.ts';
import * as drawMinimap_module from './minimap.ts';

export { icon } from '../ui/icons.ts';


import type { UI } from '../ui.ts';
function visibleForRadar(a:HUDData['actors'][number],p:HUDData['player'],d:HUDData){return visible({x:p.x,y:p.y+1.6,z:p.z},{x:a.x,y:a.y+1.6,z:a.z},d.map.props);}
export function stateChanged(this:UI,state:GameState):void{this.state=state;if(state!=='playing')this.touchControls?.reset();this.app.classList.toggle('operator-dead',state==='dead');if(state==='menu'){this.screen='play';this.menu();}else if(state==='playing'){this.bindingCapture?.abort();this.bindingCapture=null;if(!this.app.querySelector('#hud'))this.buildHUD();this.app.querySelector('#pause-layer')?.remove();this.app.querySelector('#death-layer')?.remove();}else if(state==='paused')this.showPause();else if(state==='dead'){this.app.querySelector('#pause-layer')?.remove();if(!this.app.querySelector('#hud'))this.buildHUD();this.app.querySelector('#death-layer')?.remove();const dead=document.createElement('div');dead.id='death-layer';dead.className='death-layer';dead.innerHTML=`<span class="tiny-overline">OPÉRATEUR À TERRE</span><h2>HORS COMBAT</h2><p id="death-by"></p><span id="respawn-counter">RETOUR DANS 3 S</span>`;this.app.appendChild(dead);}else if(state==='ending')this.app.querySelector('#pause-layer')?.remove();}
export function buildHUD(this:UI):void{this.touchControls?.dispose();this.touchControls=null;this.app.className='game-app';this.app.innerHTML=hudMarkup(this.settings,this.mobile,this.mobile?this.touchMarkup():'');
    const feedback=document.createElement('div');feedback.className='combat-feedback';feedback.innerHTML='<div id="damage-direction" class="damage-direction" aria-hidden="true"></div><div id="reload-progress" class="reload-progress" role="progressbar" aria-label="Rechargement" aria-valuemin="0" aria-valuemax="100"><span id="reload-stage"></span><i><b></b></i></div>';this.app.querySelector('#hud')!.appendChild(feedback);
    this.app.querySelector('#scope-overlay')!.insertAdjacentHTML('beforeend','<span id="scope-calibration" class="scope-calibration">REVENANT / OPTIQUE</span><span class="scope-ticks" aria-hidden="true"></span>');
    this.app.querySelector('#hud')!.insertAdjacentHTML('beforeend','<div id="squad-panel" class="squad-panel" aria-label="État de votre escouade"></div>');
    this.hudRefs={};for(const e of this.app.querySelectorAll<HTMLElement>('[id]'))this.hudRefs[e.id]=e;this.minimap=this.app.querySelector('#minimap');setRootProperty('--crosshair',this.settings.crosshair);
    setRootProperty('--touch-scale',String(this.settings.touchScale??1));toggleRootClass('left-handed',!!this.settings.leftHanded);
    const controls=this.app.querySelector<HTMLElement>('#touch-controls');if(controls&&this.game){const game=this.game;this.touchControls=new TouchControls(controls,game.touch,{allowed:action=>this.state==='playing'||(this.state==='dead'&&(action==='pause'||action==='score')),look:(x,y)=>game.lookTouch(x,y),action:action=>game.touchAction(action)});}
  }
export function touchMarkup(this:UI):string{
    const button=(action:string,label:string,name:string,extra='')=>`<button type="button" class="touch-button touch-${action} ${extra}" data-touch="${action}" aria-label="${name}" ${['aim','crouch','sprint','score','view'].includes(action)?'aria-pressed="false"':''}>${icon(action==='aim'?'target':action==='fire'?'cross':action)}<span>${label}</span></button>`;
    return `<div id="touch-controls" class="touch-controls" aria-label="Commandes tactiles"><div class="touch-look-zone" data-touch="look" aria-hidden="true"></div><div class="touch-joystick" data-touch="move" role="group" aria-label="Joystick de déplacement"><i class="joystick-ring"></i><i class="joystick-knob"></i><span>BOUGER</span></div><div class="touch-toolbar">${button('score','SCORES','Afficher ou masquer les scores')}${button('pause','PAUSE','Mettre la partie en pause')}</div>${button('fire','TIR','Maintenir pour tirer, glisser pour viser')}${button('aim','VISÉE','Activer ou désactiver la visée')}${button('interact','ÉCHELLE','Monter sur une échelle ou la quitter')}${button('reload','RECH.','Recharger')}${button('jump','SAUT','Sauter')}${button('crouch','BAS','S’accroupir ou glisser pendant le sprint')}${button('grenade','GRENADE','Lancer une grenade')}${button('view','VUE','Changer entre première et troisième personne')}${button('sprint','SPRINT','Sprinter')}<div class="touch-weapons" role="group" aria-label="Changer d’arme">${normalizeCareer(this.profile.career,this.profile.collection).loadout.map((id,i)=>`<button type="button" class="touch-weapon" data-touch="weapon-${i+1}" data-weapon-id="${id}" aria-label="${id==='grenade'?'Lancer grenade':id==='medkit'?'Utiliser soins':weaponById(id).name}"><b>${i+1}</b><span>${id==='grenade'?'GRENADE':id==='medkit'?'SOINS':weaponById(id).name.split(' ')[0]}</span></button>`).join('')}</div><span class="auto-fire-status" id="auto-fire-status"></span></div>`;
  }
export function hud(this:UI,...args:Parameters<typeof hud_module.hud>):ReturnType<typeof hud_module.hud>{return hud_module.hud.apply(this,args);}
export function drawMinimap(this:UI,...args:Parameters<typeof drawMinimap_module.drawMinimap>):ReturnType<typeof drawMinimap_module.drawMinimap>{return drawMinimap_module.drawMinimap.apply(this,args);}
