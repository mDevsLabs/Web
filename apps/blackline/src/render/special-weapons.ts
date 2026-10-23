import * as T from 'three';
import type { SkinId } from '../skin-catalog.ts';
import { applyWeaponSkin } from '../skins.ts';
import { finishMaterial } from '../surfaces.ts';
import type { WeaponSpec } from '../types.ts';
import { createMuzzleFlash } from '../viewmodel.ts';
import { material,meshBeveledBox,meshBox,meshCylinder,optimizeModel } from './primitives.ts';
import { opticGlass } from './weapon-common.ts';
import { addWeaponDetails } from './weapon-detail.ts';
export function createSpecialWeapon(w:WeaponSpec,firstPerson:boolean,skin:SkinId){
  const root=new T.Group(),steel=0x181e22,tan=0x73715a,shotgun=w.id==='shotgun',body=w.color;
  meshBeveledBox(shotgun?.145:.19,shotgun?.17:.23,shotgun?.47:.59,0,0,-.11,body,root,.5,.5);
  meshBox(.12,.08,.43,0,.092,-.11,steel,root,.5,.4);
  const stock=meshBeveledBox(.12,.13,.34,0,-.026,.32,tan,root);stock.rotation.x=-.08;meshBox(.15,.25,.058,0,-.035,.51,steel,root);
  const grip=meshBox(.095,.21,.12,0,-.17,.10,tan,root);grip.rotation.x=-.24;
  const guard=new T.Mesh(new T.TorusGeometry(.055,.009,6,16,Math.PI*1.5),material(steel));guard.rotation.y=Math.PI/2;guard.rotation.z=Math.PI;guard.position.set(0,-.13,-.01);root.add(guard);
  const barrel=meshCylinder(shotgun?.029:.025,shotgun?.029:.025,shotgun?.58:.67,steel,root,0,.037,-.61,16,true);barrel.rotation.x=Math.PI/2;
  const muzzle=shotgun?-.92:-1.01,ring=new T.Mesh(new T.TorusGeometry(shotgun?.029:.032,.006,8,16),material(tan,.5,.5));ring.position.set(0,.037,muzzle);root.add(ring);
  const bolt=new T.Group();bolt.name='charging-handle';bolt.position.set(.108,.03,.005);root.add(bolt);meshBox(.05,.028,.045,0,0,0,steel,bolt);
  const magazine=new T.Group();magazine.name='magazine';root.add(magazine);
  if(shotgun){
    const tube=meshCylinder(.022,.022,.51,steel,root,0,-.054,-.55,14);tube.rotation.x=Math.PI/2;
    const pump=meshBeveledBox(.15,.12,.25,0,-.015,-.49,body,root);for(let i=0;i<10;i++)meshBox(.16,.018,.009,0,-.048,-.38-i*.022,steel,root);
    magazine.position.set(0,-.054,-.62);meshBox(.06,.07,.19,0,0,0,steel,magazine);
    for(let i=0;i<4;i++){const shell=meshCylinder(.014,.014,.085,tan,root,.084,-.017,-.06+i*.033,8);shell.rotation.x=Math.PI/2;}
    for(const side of [-1,1])for(let i=0;i<6;i++)meshBox(.008,.035,.01,side*.077,-.02,.055+i*.018,steel,root);
  }else{
    magazine.position.set(0,-.24,-.15);meshBeveledBox(.25,.31,.24,0,0,0,body,magazine);meshBox(.26,.04,.25,0,-.17,0,steel,magazine);
    for(let i=0;i<6;i++)meshBox(.012,.23,.018,.132,0,-.095+i*.035,tan,magazine);
    meshBox(.15,.13,.3,0,.01,-.46,body,root);for(let i=0;i<9;i++){meshBox(.17,.015,.015,0,.088,-.34-i*.028,steel,root);for(const side of [-1,1])meshBox(.009,.06,.018,side*.082,.015,-.35-i*.029,steel,root);}
    for(const side of [-1,1]){const leg=meshBox(.022,.28,.025,side*.07,-.13,-.72,steel,root);leg.rotation.z=side*.28;}
    meshBox(.02,.13,.02,.11,.15,-.22,steel,root);meshBox(.17,.02,.02,.03,.21,-.22,steel,root);
  }
  meshBox(.08,.06,.09,0,.137,-.06,steel,root);const tube=meshCylinder(.068,.068,.09,steel,root,0,.23,-.064,24,true);tube.rotation.x=Math.PI/2;
  const lens=new T.Mesh(new T.CircleGeometry(.061,24),opticGlass);lens.position.set(0,.23,-.019);root.add(lens);
  const rim=new T.Mesh(new T.TorusGeometry(.066,.007,8,24),material(steel,.5,.5));rim.position.copy(lens.position);root.add(rim);
  root.userData.muzzle=new T.Vector3(0,.037,muzzle-.01);root.userData.weaponId=w.id;
  if(firstPerson){const hand=new T.Group();hand.name='support-hand';hand.position.set(-.11,-.18,-.34);root.add(hand);meshBox(.11,.09,.13,0,0,0,0x343b34,hand);meshBox(.105,.1,.13,.07,-.15,.09,0x343b34,root);const arm=meshCylinder(.07,.085,.29,0x525a4a,root,.14,-.23,.29);arm.rotation.x=-.6;}
  addWeaponDetails(root,w);root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&!o.material.transparent)finishMaterial(o.material,o.material.metalness>=.5?'metal':'polymer');});applyWeaponSkin(root,body,skin);optimizeModel(root);
  if(firstPerson){root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});const flash=createMuzzleFlash();flash.position.copy(root.userData.muzzle);root.add(flash);}return root;
}
