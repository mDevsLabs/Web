import { buyPower,claimReward,equipLoadoutWeapon,normalizeCareer,normalizeLoadout } from '../../lib/game/career.js';
import { equipItem,normalizeCollection,ownsWeapon,purchase } from '../../lib/game/shop-catalog.js';
import type { UpgradeId } from '../progression.ts';
import { toggleUpgrade,weaponLevel } from '../progression.ts';
import { SKINS,allowedSkin } from '../skin-catalog.ts';
import { saveProfile,saveSettings } from '../storage.ts';
import type { MatchConfig } from '../types.ts';
import type { UI } from '../ui.ts';
import { icon } from '../ui/icons.ts';
import { preloadPage } from './page-loader.ts';
import { disposeArsenalViewer, mountArsenalViewer } from './weapon-viewer.ts';
export function bindMenu(this:UI){
    if (this.screen === 'arsenal') {
      mountArsenalViewer(this);
    } else {
      disposeArsenalViewer(this);
    }
    this.app.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b=>{const preload=()=>void preloadPage(b.dataset.nav!).catch(()=>{});b.addEventListener('pointerenter',preload,{once:true});b.addEventListener('focus',preload,{once:true});});
    this.app.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b=>b.onclick=()=>{this.game?.audio.ui();this.screen=b.dataset.nav!;this.menu();});
    this.app.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{this.config.mode=b.dataset.mode as MatchConfig['mode'];this.game?.audio.ui();this.menu();});
    this.app.querySelectorAll<HTMLButtonElement>('[data-map]').forEach(b=>b.onclick=()=>{this.config.map=b.dataset.map as MatchConfig['map'];this.game?.menuMap(this.config.map);this.game?.audio.ui();this.menu();});
    this.app.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b=>b.onclick=()=>{if(!ownsWeapon(this.profile.collection,b.dataset.weapon!)){this.screen='shop';this.menu();return;}equipLoadoutWeapon(this.profile,b.dataset.weapon!);this.config.weapon=this.profile.weapon;saveProfile(this.profile);this.game?.audio.ui();this.menu();});
    const deploy=this.app.querySelector<HTMLButtonElement>('#deploy');if(deploy){deploy.disabled=!this.engineReady;deploy.onclick=()=>{if(!this.engineReady)return;if(!this.game){this.notice('Le moteur 3D n’est pas disponible. Activez WebGL et rechargez le Site.');return;}disposeArsenalViewer(this);this.killRows=[];this.game.stamina=100;this.game.collection=normalizeCollection(this.profile.collection,this.profile.xp);this.game.career=normalizeCareer(this.profile.career,this.game.collection);this.game.start(this.config);};}
    for(const key of ['difficulty','allies','enemies','duration']){const e=this.app.querySelector<HTMLSelectElement>('#'+key);if(e)e.onchange=()=>{if(key==='difficulty')this.config.difficulty=e.value as MatchConfig['difficulty'];else if(key==='allies'||key==='enemies'){this.config[key]=Number(e.value);this.config.bots=(this.config.allies??3)+(this.config.enemies??4);}else this.config.duration=Number(e.value);};}
    const audio=this.app.querySelector<HTMLButtonElement>('#audio-toggle');if(audio)audio.onclick=()=>{this.settings.volume=this.settings.volume>0?0:.6;saveSettings(this.settings);this.game?.audio.setVolume(this.settings.volume);audio.innerHTML=icon(this.settings.volume>0?'audio':'mute');};
    const full=this.app.querySelector<HTMLButtonElement>('#fullscreen');if(full)full.onclick=()=>this.game?.fullscreen();
    this.app.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(b=>b.onclick=()=>{if(toggleUpgrade(this.profile.weaponProgress??={},this.config.weapon,b.dataset.upgrade as UpgradeId)){saveProfile(this.profile);this.menu();}});
    this.app.querySelectorAll<HTMLButtonElement>('[data-skin]').forEach(b=>b.onclick=()=>{const state=this.profile.weaponProgress?.[this.config.weapon];if(state&&SKINS.some(s=>s.id===b.dataset.skin&&s.level<=weaponLevel(state.xp))){state.skin=allowedSkin(b.dataset.skin,weaponLevel(state.xp));saveProfile(this.profile);this.menu();}});
    const hero=this.app.querySelector<HTMLButtonElement>('#hero-deploy');if(hero){hero.disabled=!this.engineReady;hero.onclick=()=>this.app.querySelector<HTMLButtonElement>('#deploy')?.click();}
    this.app.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b=>b.onclick=()=>{const result=purchase(this.profile,b.dataset.buy!);saveProfile(this.profile);this.menu();this.notice(result.message);});
    this.app.querySelectorAll<HTMLButtonElement>('[data-equip-item]').forEach(b=>b.onclick=()=>{if(equipItem(this.profile,b.dataset.equipItem!)){equipLoadoutWeapon(this.profile,this.profile.weapon);this.config.weapon=this.profile.weapon;saveProfile(this.profile);this.menu();this.notice('Équipement prêt pour la prochaine opération.');}});
    this.app.querySelectorAll<HTMLButtonElement>('[data-shop-filter]').forEach(b=>b.onclick=()=>{this.shopFilter=b.dataset.shopFilter!;this.menu();});
    this.app.querySelector('[data-reset-effects]')?.addEventListener('click',()=>{this.profile.collection=normalizeCollection(this.profile.collection,this.profile.xp);this.profile.collection.shot='standard';this.profile.collection.kill='none';saveProfile(this.profile);this.menu();this.notice('Effets classiques rétablis.');});
    this.app.querySelectorAll<HTMLButtonElement>('[data-guide-step]').forEach(b=>b.onclick=()=>{this.profile.guideStep=Math.max(0,Math.min(5,Number(b.dataset.guideStep)));saveProfile(this.profile);this.menu();});
    this.app.querySelector('[data-guide-finish]')?.addEventListener('click',()=>{this.profile.guideComplete=true;saveProfile(this.profile);this.screen='play';this.menu();this.notice('Guide terminé. Prêt pour votre première opération !');});
    this.app.querySelector('[data-guide-training]')?.addEventListener('click',()=>{Object.assign(this.config,{mode:'tdm',difficulty:'recruit',bots:7,duration:180,weapon:'ar'});this.screen='play';this.menu();this.app.querySelector('#deploy')?.scrollIntoView({block:'center',behavior:this.settings.reduceMotion?'instant':'smooth'});});
    this.app.querySelectorAll<HTMLButtonElement>('[data-claim]').forEach(b=>b.onclick=()=>{if(claimReward(this.profile,b.dataset.claim!)){saveProfile(this.profile);this.menu();this.notice('Ravitaillement reçu. Vos pièces sont disponibles dans l’arsenal.');}});
    this.app.querySelectorAll<HTMLButtonElement>('[data-buy-power]').forEach(b=>b.onclick=()=>{if(buyPower(this.profile,b.dataset.buyPower!)){saveProfile(this.profile);this.menu();}});
    this.app.querySelectorAll<HTMLButtonElement>('[data-loadout]').forEach(b=>b.onclick=()=>{const c=this.profile.career=normalizeCareer(this.profile.career,this.profile.collection),id=b.dataset.loadout!,next=c.loadout.includes(id)?c.loadout.filter(i=>i!==id):[...c.loadout,id];if(next.length>5)return;if(!next.some(i=>i!=='medkit'&&i!=='grenade')){this.notice('Gardez au moins une arme équipée.');return;}c.loadout=normalizeLoadout(next,this.profile.collection);if(!c.loadout.includes(this.config.weapon)){this.profile.weapon=this.config.weapon=c.loadout.find(i=>i!=='medkit'&&i!=='grenade')!;}saveProfile(this.profile);this.menu();});
    this.app.querySelectorAll<HTMLSelectElement>('[data-outfit]').forEach(e=>e.onchange=()=>{const c=this.profile.career=normalizeCareer(this.profile.career,this.profile.collection);c.appearance[e.dataset.outfit as 'self'|'ally'|'enemy']=e.value;saveProfile(this.profile);});
    this.saves.bind();
  }