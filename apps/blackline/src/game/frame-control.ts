import type { Game } from '../game.ts';
import { FramePacer } from './frame-pacer.ts';
export function scheduleFrame(this:Game,delay=0){if(this.disposed||this.suspended||this.frameTimer!==undefined||this.frameRequest!==undefined)return;
  if(delay>0)this.frameTimer=setTimeout(()=>{this.frameTimer=undefined;if(!this.disposed&&!this.suspended)this.frameRequest=requestAnimationFrame(this.frame);},delay);
  else this.frameRequest=requestAnimationFrame(this.frame);
}
export function invalidateFrame(this:Game){this.renderDirty=true;if(this.disposed)return;this.pacer??=new FramePacer();this.pacer.reset();if(typeof document==='undefined'||document.hidden||typeof requestAnimationFrame!=='function')return;this.suspended=false;if(this.frameTimer!==undefined){clearTimeout(this.frameTimer);this.frameTimer=undefined;}scheduleFrame.call(this);}
export function suspendFrame(this:Game){this.suspended=true;if(this.frameTimer!==undefined){clearTimeout(this.frameTimer);this.frameTimer=undefined;}if(this.frameRequest!==undefined){cancelAnimationFrame(this.frameRequest);this.frameRequest=undefined;}}
