import { overlay,toggleRootClass } from './root.ts';
export function portraitViewport(mobile:boolean,width:number,height:number){return mobile&&Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>width;}
export function landscapeBlocked(mobile:boolean){if(!mobile||typeof window==='undefined')return false;const orientation=window.screen?.orientation?.type;if(orientation?.startsWith('portrait'))return true;return portraitViewport(mobile,window.innerWidth,window.innerHeight);}
export async function requestLandscape(){
  try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{ /* The rotation overlay still enforces landscape. */ }
  const orientation=typeof window!=='undefined'?(window.screen?.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>}|undefined):undefined;
  try{await orientation?.lock?.('landscape');}catch{ /* Rotate the device when browser locking is unavailable. */ }
}
interface Pausable {state:string;pause():void;touch:{reset():void};}
export function installLandscapeGuard(mobile:boolean,app:HTMLElement,getGame:()=>Pausable|null){
  if(!mobile)return ()=>{};
  const layer=document.createElement('section');layer.id='landscape-gate';layer.hidden=true;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','landscape-title');
  layer.innerHTML='<span class="rotate-device" aria-hidden="true">↻</span><span class="tiny-overline">BLACKLINE / MOBILE</span><h1 id="landscape-title">Tournez votre téléphone</h1><p>Le jeu se joue exclusivement en paysage.<br>Votre partie est mise en pause en portrait.</p><button class="primary-button" type="button">ACTIVER LE PLEIN ÉCRAN</button><small>Si la rotation est bloquée, désactivez le verrouillage de votre téléphone.</small>';
  // La superposition est portée par l'HÔTE des superpositions, pas par
  // `document.body` : dans l'hôte mAI, `body` est celui du chat, et l'overlay
  // « tournez votre téléphone » doit couvrir le JEU — pas toute la page.
  overlay().append(layer);layer.querySelector('button')!.onclick=()=>void requestLandscape();
  const update=()=>{const blocked=landscapeBlocked(mobile);layer.hidden=!blocked;app.inert=blocked;toggleRootClass('portrait-blocked',blocked);if(blocked){const game=getGame();game?.touch.reset();if(game&&(game.state==='playing'||game.state==='dead'))game.pause();}};
  window.addEventListener('resize',update);window.addEventListener('orientationchange',update);window.screen?.orientation?.addEventListener?.('change',update);update();
  return update;
}
