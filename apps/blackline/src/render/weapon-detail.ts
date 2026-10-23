import * as T from 'three';
import type { WeaponSpec } from '../types.ts';
import { meshBox,meshCylinder } from './primitives.ts';
const decals=new Map<string,T.MeshStandardMaterial>();
export function addWeaponDetails(root:T.Group,w:WeaponSpec){
  const pistol=w.id==='pistol',wide=pistol?.072:.083,steel=0x181e22;
  for(const side of [-1,1]){
    for(const z of pistol?[-.09,.055]:[-.02,-.26]){const screw=meshCylinder(.007,.007,.006,0x73715a,root,side*wide,.023,z,8);screw.rotation.z=Math.PI/2;meshBox(.007,.002,.008,side*(wide+.004),.023,z,steel,root);}
    const selector=meshCylinder(.013,.013,.007,steel,root,side*wide,-.005,pistol?.011:.085,12);selector.rotation.z=Math.PI/2;
  }
  // Shared small decals, generated once per weapon. They remain below the optical axis.
  if(typeof document==='undefined')return;
  let mat=decals.get(w.id);if(!mat){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const context=canvas.getContext('2d');if(!context)return;context.fillStyle='#172229';context.fillRect(0,0,512,128);context.fillStyle='#b5c2bb';context.font='bold 40px monospace';context.fillText(w.name.split(' ')[0]+' / BL',24,50);context.font='22px monospace';context.fillStyle='#82948d';context.fillText('SER. 008 / 2147    SAFE • FIRE',24,94);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;mat=new T.MeshStandardMaterial({map:texture,roughness:.6,metalness:.35});decals.set(w.id,mat);}
  for(const side of [-1,1]){const plate=new T.Mesh(new T.PlaneGeometry(pistol?.11:.18,.037),mat);plate.position.set(side*(wide+.004),pistol?.087:.025,pistol?-.15:-.14);plate.rotation.y=side*Math.PI/2;root.add(plate);}
}
