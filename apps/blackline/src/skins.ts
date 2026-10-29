import * as T from 'three';
import type { SkinId } from './skin-catalog.ts';
import { SKINS } from './skin-catalog.ts';
import { surfaceMaps } from './surfaces.ts';
const maps=new Map<string,T.DataTexture>(),palettes=new Map<string,T.MeshStandardMaterial>();
export function skinMap(id:SkinId){
  const cached=maps.get(id);if(cached)return cached;
  const size=256,data=new Uint8Array(size*size*4),skin=SKINS.find(s=>s.id===id)!;
  const body=[1,3,5].map(offset=>parseInt(skin.body.slice(offset,offset+2),16)),accentColor=[1,3,5].map(offset=>parseInt(skin.accent.slice(offset,offset+2),16));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,grain=((x*73+y*151+x*y*7)%17)-8;
    const patch=Math.sin(Math.floor(x/24)*1.4+Math.cos(Math.floor(y/20)*2))*Math.cos(Math.floor(y/18)*1.1);
    const line=id==='night'&&((y%64<3&&x%96<68)||(x%96<3&&y%64<48));
    const accent=id==='night'?line:id==='ember'?(x+y)%94<5:false;
    const base=accent?accentColor:body;
    const shade=id==='arctic'?(patch>.4?.65:patch<-.3?.83:1):id==='night'&&!line?.72:.95;
    for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.max(0,Math.round(base[c]*shade+grain)));data[i+3]=255;
  }
  const t=new T.DataTexture(data,size,size);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;maps.set(id,t);return t;
}
export function applyWeaponSkin(root:T.Group,body:number,id:SkinId){
  const skin=SKINS.find(s=>s.id===id)!,steel=0x181e22,tan=0x73715a;
  root.userData.skin=id;
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial)||o.material.transparent)return;
    const original=o.material,color=original.color.getHex();if(![body,steel,tan].includes(color))return;
    const role=color===body?'body':color===tan?'accent':'steel',key=`${id}:${body}:${role}:${original.metalness}`;
    let m=palettes.get(key);if(!m){m=original.clone();m.color.set(role==='body'?'#ffffff':role==='accent'?skin.accent:id==='arctic'?'#374954':'#202a30');m.map=role==='body'?skinMap(id):surfaceMaps(role==='steel'?'metal':'polymer').color;m.roughness=role==='body'?(id==='ember'?.38:.58):role==='steel'?.4:.75;palettes.set(key,m);}o.material=m;
  });
}
