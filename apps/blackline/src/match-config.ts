import type {MatchConfig} from './types.ts';
import {MAP_IDS} from './maps/catalog.ts';
const count=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(20,Math.max(1,Math.round(v))):fallback;
export function teamCounts(c:Pick<MatchConfig,'bots'|'allies'|'enemies'>){return {allies:count(c.allies,count(Math.floor(c.bots/2),3)),enemies:count(c.enemies,count(Math.ceil(c.bots/2),4))};}
export function normalizeMatchConfig(c:MatchConfig):MatchConfig{const teams=teamCounts(c);return {...c,...teams,bots:teams.allies+teams.enemies,map:MAP_IDS.includes(c.map)?c.map:'harbor',mode:['tdm','domination','hardpoint','survival'].includes(c.mode)?c.mode:'tdm',difficulty:['recruit','regular','veteran'].includes(c.difficulty)?c.difficulty:'regular',duration:[180,300,480].includes(c.duration)?c.duration:300};}
