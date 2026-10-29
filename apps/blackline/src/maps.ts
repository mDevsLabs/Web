import {interiorProps} from './interiors.ts';
import {roofProps} from './traversal.ts';
import type {MapData,MapId} from './types.ts';
import {ARENAS} from './maps/catalog.ts';
import {classicProps} from './maps/classic.ts';
import {expansionProps} from './maps/expansion.ts';
import {prop} from './maps/props.ts';
export function createMap(id:MapId):MapData {
 const classic=id==='harbor'||id==='outpost',props=classic?classicProps(id):expansionProps(id),meta=ARENAS[id];
 if(classic){
  props.push(prop('building',-44,-38,12,12,7,id==='harbor'?0x65716a:0x9c927d,'ANNEXE'),prop('building',44,38,12,12,7,id==='harbor'?0x65716a:0x9c927d,'RELAIS'));
  for(const side of [-1,1]){for(const z of [-34,-17,0,17,34])props.push(prop('tree',side*53,z,.65,.65,7));for(const z of [-39,39]){props.push(prop('barrier',side*23,z,6,1.2,1.1));props.push(prop('crate',side*8,z,2.5,2.5,1.6));}props.push(prop('container',side*45,-side*15,3.6,11,3.4,0x56665c,'SECTEUR'));}
 }
 for(const b of props.filter(p=>p.kind==='building').slice(0,2)){b.enterable=true;b.solid=false;props.push(...interiorProps(b));}
 props.push(...props.filter(p=>p.kind==='building').flatMap(roofProps));
 const spawnX=classic?34:49,spawnZ=classic?28:37;
 return {id,name:meta.name,subtitle:meta.subtitle,width:meta.width,depth:meta.depth,props,
  spawns:[[{x:-spawnX,z:spawnZ},{x:-spawnX-4,z:spawnZ-4},{x:-spawnX+3,z:spawnZ+4},{x:-spawnX-3,z:spawnZ+3}],[{x:spawnX,z:-spawnZ},{x:spawnX+4,z:-spawnZ+4},{x:spawnX-3,z:-spawnZ-4},{x:spawnX+3,z:-spawnZ-3}]],
  objectives:classic?[{x:-21,z:3},{x:0,z:0},{x:21,z:-3}]:id==='forest'?[{x:-24,z:8},{x:0,z:0},{x:24,z:-8}]:[{x:-25,z:3},{x:0,z:0},{x:25,z:-3}]};
}
