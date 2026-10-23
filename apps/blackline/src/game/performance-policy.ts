import type { Settings } from '../types.ts';
export function targetFPS(state:string,settings:Settings,hidden=false){if(hidden)return 0;if(state==='menu'||state==='ending')return 15;if(state==='paused')return 8;return settings.batterySaver?30:120;}
export function effectiveQuality(settings:Settings){return settings.quality;}

export function idleRender(state:string,settings:Settings){return state==='paused'||state==='ending'||state==='menu'&&(settings.batterySaver===true||settings.reduceMotion===true);}
