import * as T from 'three';
import type { SkinId } from '../skin-catalog.ts';
import { applyWeaponSkin } from '../skins.ts';
import { finishMaterial } from '../surfaces.ts';
import type { WeaponSpec } from '../types.ts';
import { createMuzzleFlash } from '../viewmodel.ts';
import { material,meshBeveledBox,meshBox,meshCylinder,optimizeModel } from './primitives.ts';
import { opticGlass } from './weapon-common.ts';
import { addWeaponDetails } from './weapon-detail.ts';
export function createRifle(w:WeaponSpec,firstPerson=false,skin:SkinId='factory'):T.Group {
  const root=new T.Group(),body=w.color,steel=0x181e22,tan=0x73715a;
  const long=(w.model??w.id)==='dmr',smg=w.id==='smg',len=long?.76:smg?.36:.57;
  meshBeveledBox(smg?.17:.14,smg?.21:.18,len,0,0,-.18,body,root,.65,.38);
  meshBox(.12,.095,len*.75,0,.065,-.21,steel,root,.6,.4);
  meshBox(smg?.15:.1,.14,smg?.27:.35,0,0,-len*.6-.3,smg?body:tan,root,.35,.55);
  for(let i=0;i<9;i++){meshBox(.145,.023,.019,0,.122,-.05-i*.057,steel,root,.6);if(i<6){meshBox(.011,.095,.022,.064,-.005,-.42-i*.05,steel,root);meshBox(.011,.095,.022,-.064,-.005,-.42-i*.05,steel,root);}}
  const barrel=meshCylinder(.025,.025,long?.48:.27,steel,root,0,0,-len-.22,12);barrel.rotation.x=Math.PI/2;
  const suppressor=meshCylinder(smg?.052:.045,smg?.052:.045,.22,0x232b2e,root,0,0,-len-.42,14);suppressor.rotation.x=Math.PI/2;
  meshBeveledBox(.125,.145,.2,0,-.03,.15,body,root);
  meshBox(.1,.13,.25,0,-.025,.34,steel,root);
  meshBeveledBox(.13,.26,.07,0,-.02,.48,tan,root);
  const magazine=new T.Group();magazine.name='magazine';magazine.position.set(0,-.21,-.14);magazine.rotation.x=-.13;root.add(magazine);
  meshBeveledBox(.09,smg?.29:.27,.14,0,0,0,steel,magazine,.35);
  for(let i=0;i<4;i++)meshBox(.099,.015,.135,0,.09-i*.043,0,0x3a3f3c,magazine);
  const grip=meshBox(.09,.22,.1,0,-.18,.085,tan,root);grip.rotation.x=-.25;
  const trigger=new T.Mesh(new T.TorusGeometry(.065,.012,6,12,Math.PI),material(steel));trigger.rotation.z=Math.PI;trigger.position.set(0,-.16,0);trigger.rotation.y=Math.PI/2;root.add(trigger);
  if(long){
    const tube=meshCylinder(.047,.047,.37,steel,root,0,.21,-.19,20,true);tube.rotation.x=Math.PI/2;
    for(const z of [-.4,.025]){const bell=meshCylinder(.066,.052,.1,steel,root,0,.21,z,20,true);bell.rotation.x=Math.PI/2;const lens=meshCylinder(.055,.055,.008,0x34818a,root,0,.21,z+.05,20);lens.rotation.x=Math.PI/2;lens.material=opticGlass;}
    for(const z of [-.3,-.08]){meshBox(.075,.075,.055,0,.12,z,steel,root);const ring=meshCylinder(.055,.055,.028,steel,root,0,.21,z,16,true);ring.rotation.x=Math.PI/2;}
    meshCylinder(.032,.032,.062,steel,root,0,.29,-.17,16);const dial=meshCylinder(.03,.03,.04,steel,root,.065,.22,-.17,16);dial.rotation.z=Math.PI/2;
    for(const side of [-1,1]){const leg=meshBox(.025,.2,.025,side*.055,-.13,-.68,steel,root);leg.rotation.z=side*.16;}
  }
  else {
    // Open circular housing: there is no solid plate behind the glass.
    meshBox(.09,.055,.1,0,.14,-.08,steel,root);
    const tube=meshCylinder(.075,.075,.12,steel,root,0,.23,-.08,20,true);tube.rotation.x=Math.PI/2;
    for(const z of [-.14,-.02]){const rim=new T.Mesh(new T.TorusGeometry(.07,.009,8,24),material(steel,.65,.4));rim.position.set(0,.23,z);root.add(rim);}
    const glass=new T.Mesh(new T.CircleGeometry(.062,24),opticGlass);glass.position.set(0,.23,-.019);root.add(glass);
  }
  if(smg){
    // Compact machined receiver, telescoping stock, fluted shroud and angled foregrip.
    meshBox(.045,.17,.29,.094,.008,-.2,steel,root);
    meshBox(.013,.055,.095,.12,.05,-.09,tan,root);
    for(const side of [-1,1]){
      meshBox(.022,.032,.3,side*.063,.032,.29,steel,root);
      meshBox(.028,.11,.12,side*.066,-.018,.38,body,root);
      for(let i=0;i<5;i++){meshBox(.016,.054,.027,side*.079,.015,-.4-i*.034,steel,root);const pin=meshCylinder(.009,.009,.012,tan,root,side*.091,-.06,-.13-i*.02,8);pin.rotation.z=Math.PI/2;}
    }
    const foregrip=meshBox(.09,.17,.08,0,-.17,-.48,body,root);foregrip.rotation.x=.28;
    meshBox(.125,.038,.15,0,-.26,-.14,tan,magazine);
    meshBox(.14,.03,.09,0,.118,-.36,tan,root);
    const ring=meshCylinder(.057,.057,.025,steel,root,0,0,-len-.43,16);ring.rotation.x=Math.PI/2;
    for(let i=0;i<6;i++)meshBox(.125,.009,.028,0,-.04,.455-i*.018,steel,root);
  }
  meshBox(.012,.05,.12,.084,.01,-.03,steel,root);
  for(const z of [-.06,-.28])for(const side of [-1,1])meshBox(.014,.018,.018,side*.078,.014,z,steel,root);
  for(let i=0;i<7;i++)meshBox(.11,.007,.024,0,-.072,-.38-i*.035,tan,root);
  meshBox(.035,.024,.035,-.086,.03,.08,steel,root);
  const chargingHandle=new T.Group();chargingHandle.name='charging-handle';chargingHandle.position.set(.1,.025,.04);root.add(chargingHandle);
  const bolt=meshCylinder(.011,.011,.09,steel,chargingHandle,0,0,0,8);bolt.rotation.z=Math.PI/2;
  for(const side of [-1,1]){for(let i=0;i<4;i++)meshBox(.006,.006,.042,side*.075,.018,-.12-i*.055,tan,root);meshBox(.016,.017,.075,side*.081,.05,-.24,steel,root);}
  root.userData.muzzle=new T.Vector3(0,0,-len-.55);
  if(firstPerson){
    const glove=0x343b34,sleeve=0x525a4a;
    const right=meshCylinder(.075,.09,.29,sleeve,root,.15,-.23,.27);right.rotation.x=-.5;meshBox(.11,.105,.13,.078,-.16,.084,glove,root);
    const support=new T.Group();support.name='support-hand';support.position.set(-.13,-.19,-.22);root.add(support);
    const left=meshCylinder(.07,.095,.42,sleeve,support);left.rotation.z=-.4;left.rotation.x=.75;meshBox(.115,.095,.16,.065,.115,-.2,glove,support);
    for(let i=0;i<4;i++){meshBox(.024,.044,.065,.025+i*.026,.15,-.21,glove,support);meshBox(.02,.015,.045,.025+i*.026,.175,-.205,0x535c49,support);}
    meshBox(.12,.032,.115,.078,-.075,.085,0x68745a,root);meshBox(.025,.025,.025,.155,-.08,.1,steel,root);
    root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});
  }
  if(w.id==='carbine'){meshBox(.18,.045,.27,0,.16,.31,tan,root);for(const side of [-1,1])for(let i=0;i<5;i++)meshBox(.012,.032,.035,side*.083,.02,-.29-i*.045,0xaaa07a,root);}
  if(w.id==='marksman'){const boltKnob=meshCylinder(.025,.025,.13,tan,root,.12,-.01,.03,10);boltKnob.rotation.z=Math.PI/2;meshBox(.12,.065,.24,0,.07,.3,tan,root);const extension=meshCylinder(.026,.026,.21,steel,root,0,0,-1.32,12);extension.rotation.x=Math.PI/2;root.userData.muzzle.z=-1.44;}
  addWeaponDetails(root,w);
  // Animated pieces stay separate; static steel and polymer use a compact shared palette.
  root.traverse(o=>{if(!(o instanceof T.Mesh)||!(o.material instanceof T.MeshStandardMaterial))return;const c=o.material.color.getHex();if(c===steel)o.material=material(steel,.65,.4);else if(c===body)o.material=material(body,.5,.5);else if(c===tan)o.material=material(tan,.1,.75);});
  root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial&&!o.material.transparent)finishMaterial(o.material,o.material.metalness>=.5?'metal':'polymer');});
  root.userData.weaponId=w.id;applyWeaponSkin(root,w.color,skin);optimizeModel(root);if(firstPerson){root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;}});const flash=createMuzzleFlash();flash.position.copy(root.userData.muzzle);root.add(flash);}return root;
}

