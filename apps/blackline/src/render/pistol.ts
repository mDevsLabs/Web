import * as T from 'three';
import type { SkinId } from '../skin-catalog.ts';
import { applyWeaponSkin } from '../skins.ts';
import { finishMaterial } from '../surfaces.ts';
import type { WeaponSpec } from '../types.ts';
import { createMuzzleFlash } from '../viewmodel.ts';
import { geometries,material,meshBox,meshCylinder,optimizeModel } from './primitives.ts';
import { opticGlass } from './weapon-common.ts';
import { addWeaponDetails } from './weapon-detail.ts';
// The side profile is extruded across X so the silhouette stays recognisable from every angle.
function pistolProfile(key:string,points:[number,number][],width:number,color:number,parent:T.Group,metal=.1){
  let geometry=geometries.get(key);
  if(!geometry){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,steps:1,curveSegments:8});geometry.rotateY(-Math.PI/2);geometry.translate(width/2,0,0);geometries.set(key,geometry);}
  const mesh=new T.Mesh(geometry,material(color,metal,.5));parent.add(mesh);return mesh;
}
export function createPistol(w:WeaponSpec,firstPerson:boolean,skin:SkinId){
  const root=new T.Group(),steel=0x181e22,polymer=w.color,tan=0x73715a;
  const slide=new T.Group();slide.name='charging-handle';slide.position.set(0,.087,-.10);root.add(slide);
  pistolProfile('pistol-slide-v7',[[-.265,-.036],[-.265,.027],[-.246,.050],[.123,.050],[.153,.018],[.149,-.036]],.127,steel,slide,.65);
  pistolProfile('pistol-frame-v7',[[-.345,.046],[-.345,-.012],[-.145,-.026],[-.058,-.065],[.014,-.07],[.030,-.256],[.139,-.278],[.111,-.061],[.106,.045]],.111,polymer,root);
  // Separate textured grip panels, rear beavertail and a magazine seated inside the grip.
  for(const side of [-1,1]){
    const panel=pistolProfile('pistol-grip-panel-v7',[[.031,-.098],[.107,-.085],[.126,-.238],[.045,-.221]],.008,polymer,root);panel.position.x=side*.063;
    for(let i=0;i<9;i++)meshBox(.007,.006,.066,side*.07,-.111-i*.012,.073+i*.002,steel,root);
    for(let i=0;i<8;i++)meshBox(.008,.071,.006,side*.068,.09,.039-i*.012,tan,root);
    const pin=meshCylinder(.009,.009,.005,tan,root,side*.07,-.076,.007,10);pin.rotation.z=Math.PI/2;
  }
  meshBox(.125,.019,.055,0,.01,.139,steel,root);
  const mag=new T.Group();mag.name='magazine';mag.position.set(0,-.23,.080);mag.rotation.x=-.12;root.add(mag);meshBox(.084,.093,.084,0,0,0,steel,mag);meshBox(.122,.027,.127,0,-.054,.009,polymer,mag);
  // Closed hollow trigger guard and curved trigger, with no plate filling the opening.
  const guard=new T.Shape();guard.moveTo(-.16,-.022);guard.lineTo(-.165,-.093);guard.quadraticCurveTo(-.16,-.121,-.13,-.121);guard.lineTo(-.005,-.121);guard.lineTo(.013,-.027);guard.closePath();
  const hole=new T.Path();hole.moveTo(-.145,-.043);hole.lineTo(-.010,-.043);hole.lineTo(-.02,-.104);hole.lineTo(-.13,-.104);hole.quadraticCurveTo(-.146,-.104,-.146,-.089);hole.closePath();guard.holes.push(hole);
  let guardGeo=geometries.get('pistol-trigger-guard-v7');if(!guardGeo){guardGeo=new T.ExtrudeGeometry(guard,{depth:.055,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,steps:1});guardGeo.rotateY(-Math.PI/2);guardGeo.translate(.0275,0,0);geometries.set('pistol-trigger-guard-v7',guardGeo);}root.add(new T.Mesh(guardGeo,material(steel,.5,.5)));
  pistolProfile('pistol-trigger-v7',[[-.030,-.037],[-.041,-.073],[-.070,-.090],[-.080,-.083],[-.054,-.067],[-.047,-.037]],.012,steel,root,.5);
  const barrel=meshCylinder(.021,.021,.092,steel,root,0,.084,-.343,16,true);barrel.rotation.x=Math.PI/2;
  const muzzleRing=new T.Mesh(new T.TorusGeometry(.021,.004,6,16),material(steel,.5,.4));muzzleRing.position.set(0,.084,-.39);root.add(muzzleRing);
  // Ejection port and slide release add landmarks without making the sight opaque.
  meshBox(.009,.025,.084,.073,.11,-.081,tan,root,.5);meshBox(.009,.012,.055,-.065,.009,-.030,steel,root,.5);
  meshBox(.012,.013,.018,0,.15,-.326,tan,root);for(const side of [-1,1])meshBox(.013,.015,.023,side*.032,.146,.046,steel,root);
  const glass=new T.Mesh(new T.CircleGeometry(.032,24),opticGlass);glass.position.set(0,.16,-.019);root.add(glass);
  const rim=new T.Mesh(new T.TorusGeometry(.038,.004,8,24),material(steel,.5,.4));rim.position.copy(glass.position);root.add(rim);meshBox(.07,.012,.035,0,.116,-.019,steel,root);
  root.userData.muzzle=new T.Vector3(0,.084,-.398);
  if(firstPerson){
    meshBox(.093,.088,.105,.075,-.135,.074,0x343b34,root);const hand=new T.Group();hand.name='support-hand';hand.position.set(-.065,-.13,.073);root.add(hand);meshBox(.098,.09,.1,0,0,0,0x343b34,hand);
    for(let i=0;i<4;i++)meshBox(.026,.024,.081,-.047,-.042+i*.023,-.023,0x424d40,hand);
    for(const side of [-1,1]){const arm=meshCylinder(.059,.078,.28,0x525a4a,root,side*.106,-.239,.218);arm.rotation.x=-.6;arm.rotation.z=side*.23;}
  }
  addWeaponDetails(root,w);
  root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&!o.material.transparent)finishMaterial(o.material,o.material.metalness>=.5?'metal':'polymer');});
  root.userData.weaponId=w.id;applyWeaponSkin(root,w.color,skin);optimizeModel(root);if(firstPerson){root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});const flash=createMuzzleFlash();flash.position.copy(root.userData.muzzle);root.add(flash);}return root;
}
