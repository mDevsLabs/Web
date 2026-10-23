import { nextTask } from './preload.ts';
import { environmentMaps } from './render/environment-surfaces.ts';
import { noiseTexture } from './render/textures.ts';
import { allowedSkin } from './skin-catalog.ts';
import { skinMap } from './skins.ts';
import { surfaceMaps } from './surfaces.ts';
import type { Profile } from './types.ts';
// Generate the procedural sources in separate idle slices before allocating the WebGL scene.
export async function preloadAssets(profile:Profile,progress:(fraction:number,label:string)=>void=()=>{}){
  const jobs:{label:string;run:()=>void}[]=[
    ...(['concrete','metal','sand'] as const).map((kind,i)=>({label:'TEXTURE '+kind.toUpperCase(),run:()=>{noiseTexture(kind,[13,71,24][i]).dispose();}})),
    ...(['metal','polymer','fabric','camo'] as const).map(kind=>({label:'MATÉRIAU '+kind.toUpperCase(),run:()=>{surfaceMaps(kind);}})),
    ...(['masonry','asphalt','bark','sand'] as const).map(kind=>({label:'SURFACE '+kind.toUpperCase(),run:()=>{environmentMaps(kind);}})),
  ];
  const skins=new Set((profile.career?.loadout??['ar']).map(id=>allowedSkin(profile.weaponProgress?.[id]?.skin)));
  for(const skin of skins)jobs.push({label:'FINITION '+skin.toUpperCase(),run:()=>{skinMap(skin);}});
  for(let i=0;i<jobs.length;i++){await nextTask();jobs[i].run();progress((i+1)/jobs.length,jobs[i].label);}
}
