import * as T from 'three';
import type { SkinId } from '../skin-catalog.ts';
import { finishMaterial } from '../surfaces.ts';
import type { Team,WeaponSpec } from '../types.ts';
import { material,meshBeveledBox,meshBox,meshCylinder,optimizeModel } from './primitives.ts';
import { aimSoldierArms } from './soldier-pose.ts';
import { createWeapon } from './weapons.ts';
export interface SoldierVisual {root:T.Group;leftLeg:T.Group;rightLeg:T.Group;leftArm:T.Group;rightArm:T.Group;head:T.Group;weapon:T.Group;}
export function createSoldier(team:Team,weapon:WeaponSpec,outfit='ranger',skinId:SkinId='factory'):SoldierVisual {
  const palette=outfit==='urban'?[0x586574,0x303e50]:outfit==='desert'?[0xb29b71,0x6d604a]:outfit==='arctic'?[0xb4c5c9,0x596c77]:[team===0?0x566555:0x716558,team===0?0x344340:0x423d36];
  const root=new T.Group(),uniform=palette[0],armor=palette[1],skin=0xa48670,head=new T.Group();
  meshBeveledBox(.51,.57,.3,0,1.12,0,uniform,root);
  meshBeveledBox(.48,.4,.15,0,1.16,-.2,armor,root);meshBeveledBox(.47,.46,.2,0,1.1,.2,armor,root);
  for(let i=-1;i<=1;i++)meshBox(.125,.18,.08,i*.145,1.05,-.31,0x333c33,root);
  meshBox(.53,.08,.32,0,.84,0,armor,root);meshBox(.12,.16,.12,.32,.85,.02,armor,root);
  meshBeveledBox(.38,.31,.16,0,1.25,.34,armor,root);
  for(const side of [-1,1]){meshBox(.055,.47,.03,side*.16,1.18,-.295,armor,root);meshBox(.056,.07,.032,side*.16,1.34,-.321,armor,root);meshBox(.095,.09,.065,side*.31,.79,-.03,armor,root);}
  for(let row=0;row<4;row++)meshBox(.38,.018,.025,0,1.3-row*.07,-.286,armor,root);
  meshBox(.1,.22,.05,-.29,1.27,.15,armor,root);meshCylinder(.008,.008,.26,armor,root,-.29,1.49,.15,6);
  for(let row=0;row<3;row++)meshBox(.31,.018,.023,0,1.32-row*.065,.437,armor,root);
  for(const side of [-1,1]){meshBox(.06,.2,.12,side*.29,.94,.11,armor,root);meshBox(.037,.045,.015,side*.17,1.41,-.18,0x8e9b77,root);for(let i=0;i<3;i++)meshBox(.04,.006,.012,side*.17,1.39+i*.025,-.193,armor,root);}
  const leftLeg=new T.Group(),rightLeg=new T.Group();
  for(const [leg,x]of [[leftLeg,-.145],[rightLeg,.145]] as const){leg.position.set(x,.8,0);meshCylinder(.105,.11,.58,uniform,leg,0,-.31,0,8);meshBox(.155,.13,.13,0,-.38,-.09,armor,leg);meshCylinder(.085,.1,.21,0x2c3330,leg,0,-.68,0);meshBox(.19,.12,.3,0,-.77,-.05,0x262c2a,leg);root.add(leg);}
  head.position.y=1.58;meshCylinder(.16,.145,.27,skin,head,0,0,0,12);meshBox(.28,.12,.035,0,.035,-.151,0x182828,head);meshBox(.24,.125,.035,0,-.07,-.155,armor,head);
  const helmet=new T.Mesh(new T.SphereGeometry(.207,12,8,0,Math.PI*2,0,Math.PI*.62),material(armor));helmet.position.y=.035;helmet.castShadow=true;head.add(helmet);
  meshBox(.07,.09,.055,0,.11,-.21,0x182828,head);meshBox(.07,.045,.07,.21,.025,0,0x182828,head);root.add(head);
  for(const side of [-1,1]){meshBox(.025,.05,.16,side*.195,.045,-.025,armor,head);meshBox(.034,.035,.025,side*.192,.02,-.115,armor,head);meshBox(.03,.16,.025,side*.139,-.09,.03,armor,head);}
  const leftArm=new T.Group(),rightArm=new T.Group();
  for(const [arm,x]of [[leftArm,-.32],[rightArm,.32]] as const){arm.position.set(x,1.36,0);meshCylinder(.095,.075,.30,uniform,arm,0,-.16,0,10);const forearm=new T.Group();forearm.name='forearm';forearm.position.y=-.32;meshCylinder(.073,.065,.27,uniform,forearm,0,-.15,0,10);meshBox(.13,.12,.13,0,-.31,0,0x29342b,forearm);for(let i=0;i<3;i++)meshBox(.017,.01,.07,-.035+i*.035,-.365,-.02,0x29342b,forearm);arm.add(forearm);root.add(arm);}
  const gun=createWeapon(weapon,false,skinId);gun.scale.setScalar(.8);gun.position.set(.10,1.16,-.23);root.add(gun);
  const patch=meshBox(.006,.075,.1,team===0?-.415:.415,1.23,-.01,team===0?0x8bbab4:0x97674a,root);patch.castShadow=false;
  root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial){const color=o.material.color.getHex();if(color===uniform)finishMaterial(o.material,'camo');else if(color===armor)finishMaterial(o.material,'fabric');}});
  root.userData.outfit=outfit;for(const side of [-1,1]){for(let row=0;row<3;row++)meshBox(.075,.018,.035,side*.255,.96+row*.06,.27,armor,root);meshBox(.1,.13,.06,side*.23,.88,.33,armor,root);}meshBox(.18,.045,.012,0,1.39,.31,team===0?0x8bbab4:0x97674a,root);
  // Stitching, pack padding and helmet vents share existing material batches.
  for(const side of [-1,1]){for(let row=0;row<4;row++)meshBox(.13,.018,.018,side*.17,.96+row*.10,.32,armor,root);meshBox(.025,.44,.025,side*.22,1.13,.30,uniform,root);for(let i=0;i<5;i++)meshBox(.012,.022,.03,side*.15,.16,-.11+i*.036,0x182828,head);}
  for(let i=0;i<4;i++)meshBox(.30,.045,.04,0,1.05+i*.066,.445,armor,root);
  optimizeModel(root);const visual={root,leftLeg,rightLeg,leftArm,rightArm,head,weapon:gun};aimSoldierArms(visual);return visual;
}

