import { wallet } from '../../lib/game/shop-catalog.js';
import type { HUDData } from '../game.ts';
import { visible } from '../math.ts';
import { rankFor } from '../types.ts';
import { icon } from '../ui/icons.ts';
import { rewardMarkup } from './career.ts';
import { escape } from './format.ts';
import { pageMarkup } from './page-loader.ts';

import { homeMarkup } from './pages/home.ts';


export { icon } from '../ui/icons.ts';


import type { UI } from '../ui.ts';
function visibleForRadar(a:HUDData['actors'][number],p:HUDData['player'],d:HUDData){return visible({x:p.x,y:p.y+1.6,z:p.z},{x:a.x,y:a.y+1.6,z:a.z},d.map.props);}
export function profileMarkup(this:UI):string{const r=rankFor(this.profile.xp);return `<div class="profile-mark">${icon('shield')}</div><div><b>${escape(this.settings.callsign||'OPÉRATEUR')}</b><span>${r.name} <i>·</i> NIVEAU ${r.level}</span></div><div class="profile-level">${r.level.toString().padStart(2,'0')}</div>`;}
export function menu(this:UI):void{this.bindingCapture?.abort();this.bindingCapture=null;this.touchControls?.dispose();this.touchControls=null;this.hudRefs={};this.state='menu';this.app.className='menu-app';this.app.innerHTML=`
    <div class="scene-shade"></div><div class="screen-texture"></div>
    <header class="topbar"><button class="brand" data-nav="play" aria-label="Accueil BLACKLINE"><span class="brand-symbol">B<span>/</span></span><span>BLACKLINE</span></button><div class="top-status"><i></i> ${wallet(this.profile).toLocaleString('fr-FR')} CR <span class="top-separator"></span> ${this.mobile?'MOBILE':'PC'}</div><div class="profile">${this.profileMarkup()}</div></header>
    <aside class="sidebar">${[['play','target','JOUER'],['arsenal','gun','ARSENAL'],['shop','bolt','BOUTIQUE'],['guide','book','GUIDE'],['settings','settings','PARAMÈTRES'],['save','shield','SAUVEGARDE']].map(([id,ico,label],i)=>`<button type="button" data-nav="${id}" class="nav-item ${this.screen===id?'active':''}">${icon(ico)}<span>${label}</span><i>0${i+1}</i></button>`).join('')}<div class="sidebar-bottom"><span class="tiny-overline">OPÉRATION / 001</span><div class="side-coordinates">46° 08′ N<br>01° 09′ W</div><span class="vertical-line"></span></div></aside>
    <main class="menu-main" id="menu-content">${this.content()}</main>
    <footer class="footer"><div><span class="live-dot"></span> EXPÉRIENCE INDÉPENDANTE</div><div class="footer-actions"><span id="perf-label" class="perf-label">${this.fps?this.fps+' FPS':''}</span><button id="audio-toggle" class="icon-button" aria-label="Activer ou couper le son">${icon(this.settings.volume>0?'audio':'mute')}</button><button id="fullscreen" class="icon-button" aria-label="Plein écran">${icon('expand')}</button></div></footer>
    <div id="notice" class="notice" role="status"></div>`;
    this.bindMenu();
  }
export function content(this:UI):string{if(this.screen==='shop')return pageMarkup(this,'shop');if(this.screen==='guide'||this.screen==='intel')return this.intel();if(this.screen==='save')return this.saves.markup();if(this.screen==='arsenal')return this.arsenal();if(this.screen==='settings')return this.settingsPage();return this.playPage();}
export function playPage(this:UI):string{return homeMarkup(this)+rewardMarkup(this.profile);}
export function intel(this:UI):string{return pageMarkup(this,this.screen==='intel'?'intel':'guide');}
