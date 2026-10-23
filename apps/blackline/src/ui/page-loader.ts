import { nextTask } from '../preload.ts';
import type { UI } from '../ui.ts';
type Render=(ui:UI)=>string;
const ready=new Map<string,Render>(),pending=new Map<string,Promise<void>>();
export function preloadPage(name:string):Promise<void>{if(ready.has(name))return Promise.resolve();if(pending.has(name))return pending.get(name)!;let task:Promise<Render>;
  if(name==='arsenal')task=import('./arsenal.ts').then(m=>ui=>m.arsenalMarkup(ui.config.weapon,ui.profile.weaponProgress??{},ui.mobile,ui.profile.collection,ui.profile));
  else if(name==='shop')task=import('./pages/shop.ts').then(m=>ui=>m.shopMarkup(ui.profile,ui.shopFilter));
  else if(name==='guide'||name==='intel')task=import('./pages/guide.ts').then(m=>ui=>m.guideMarkup(ui.profile,ui.settings,ui.mobile));
  else return Promise.resolve();
  const done=task.then(render=>{ready.set(name,render);pending.delete(name);}).catch(error=>{pending.delete(name);throw error;});pending.set(name,done);return done;
}
export function pageMarkup(ui:UI,name:string){const render=ready.get(name);if(render)return render(ui);void preloadPage(name).then(()=>{if(ui.state==='menu'&&ui.screen===name)ui.menu();}).catch(()=>{ui.notice('Cette page n’a pas pu se charger. Réessayez avec une connexion disponible.');});return '<section class="sub-screen"><span class="eyebrow">PRÉPARATION DE LA PAGE…</span><p>Chargement de votre équipement et de vos données.</p></section>';}

export async function preloadMenuPages(allowed:()=>boolean=()=>true){for(const name of ['arsenal','shop','guide']){await nextTask();if(!allowed())return;try{await preloadPage(name);}catch{ /* Navigation can retry a failed optional preload. */ }}}
