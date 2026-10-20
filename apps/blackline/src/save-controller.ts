import {exportSave,importSave,saveProfile,saveSettings,flushProfileSave} from './storage.ts';
import type {UI} from './ui.ts';
import {normalizeCareer} from '../lib/game/career.js';
import {normalizeCollection} from '../lib/game/shop-catalog.js';
import {escape,number} from './ui/format.ts';
export class SaveController {
  busy=false;message='';
  constructor(readonly ui:UI){}
  markup(){return `<section class="sub-screen save-screen"><div class="eyebrow"><span class="line"></span> VOTRE PROGRESSION</div><h1 class="page-title">SAUVEGARDE<span>.</span></h1><p class="page-intro">Votre progression est enregistrée automatiquement sur cet appareil. Aucun compte ni connexion n’est nécessaire.</p><div class="save-summary"><div><b>${number(this.ui.profile.xp)}</b><span>XP ACQUIS</span></div><div><b>${this.ui.profile.matches}</b><span>OPÉRATIONS</span></div><div><b>${this.ui.profile.kills}</b><span>ÉLIMINATIONS</span></div></div><div class="save-tools"><button type="button" class="secondary-button" id="save-export">EXPORTER MA SAUVEGARDE</button><label class="secondary-button">CHOISIR UNE SAUVEGARDE JSON<input id="save-import" type="file" accept="application/json,.json" ${this.busy?'disabled':''}></label><p>Transférez le fichier JSON entre vos appareils. L’import remplace le profil local après validation ; une copie de secours reste disponible automatiquement.</p><p role="status">${escape(this.message)}</p><button class="text-button" type="button" data-nav="play">RETOUR AU JEU →</button></div></section>`;}
  bind(){
    this.ui.app.querySelector('#save-export')?.addEventListener('click',()=>{const text=exportSave(this.ui.profile,this.ui.settings);if(document.documentElement.dataset.nativeApp==='true'){window.dispatchEvent(new CustomEvent('blackline:export',{detail:text}));return;}const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='BLACKLINE-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    const input=this.ui.app.querySelector<HTMLInputElement>('#save-import');if(input)input.onchange=async()=>{
      if(this.busy||!input.files?.[0])return;this.busy=true;
      try{const file=input.files[0];if(file.size>1_000_000)throw new Error('Fichier trop volumineux.');const value=importSave(await file.text(),this.ui.mobile);this.apply(value);this.message='Sauvegarde importée. Votre profil est prêt.';}catch(error){this.message=error instanceof Error?error.message:'Import impossible.';}finally{this.busy=false;if(this.ui.state==='menu')this.ui.menu();}
    };
  }
  apply(value:ReturnType<typeof importSave>){
    flushProfileSave();Object.assign(this.ui.profile,value.profile);Object.assign(this.ui.settings,value.settings);
    const saved=saveProfile(this.ui.profile);saveSettings(this.ui.settings);this.ui.config.weapon=this.ui.profile.weapon;
    if(this.ui.game){const g=this.ui.game;g.progress=this.ui.profile.weaponProgress!;g.collection=normalizeCollection(this.ui.profile.collection,this.ui.profile.xp);g.career=normalizeCareer(this.ui.profile.career,g.collection);g.applySettings(this.ui.settings);}
    if(!saved)throw new Error('Profil importé en mémoire. Stockage indisponible : exportez une copie avant de fermer.');
  }
}
