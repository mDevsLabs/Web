import * as T from 'three';
import type { Supply } from './mission.ts';
import { finishMaterial } from './surfaces.ts';

export class SupplyVisuals {
  root=new T.Group();items:{root:T.Group;marker:T.Mesh;crate:T.Mesh}[]=[];
  materials:T.Material[]=[];geometries:T.BufferGeometry[]=[];
  constructor(scene:T.Scene,supplies:Supply[]){
    const box=new T.BoxGeometry(.75,.32,.5),trim=new T.BoxGeometry(.78,.05,.52),lock=new T.BoxGeometry(.07,.13,.05),strip=new T.BoxGeometry(.045,.33,.53),ring=new T.RingGeometry(.58,.62,32),cross=new T.BoxGeometry(.26,.055,.05);
    this.geometries.push(box,trim,lock,strip,ring,cross);
    const ammo=finishMaterial(new T.MeshStandardMaterial({color:0x64744f,roughness:.78,metalness:.2}),'polymer'),medical=finishMaterial(new T.MeshStandardMaterial({color:0xb7beb0,roughness:.7}),'polymer'),steel=new T.MeshStandardMaterial({color:0x293933,metalness:.6,roughness:.5}),mark=new T.MeshBasicMaterial({color:0xc6e690}),red=new T.MeshBasicMaterial({color:0xea9d88});
    this.materials.push(ammo,medical,steel,mark,red);
    for(const s of supplies){
      const root=new T.Group();root.position.set(s.x,0,s.z);this.root.add(root);root.name='supply-'+s.id;
      const crate=new T.Mesh(box,s.kind==='medical'?medical:ammo);crate.position.y=.24;crate.castShadow=true;crate.receiveShadow=true;root.add(crate);
      const lid=new T.Mesh(trim,steel);lid.position.y=.405;root.add(lid);
      for(const side of [-1,1]){const band=new T.Mesh(strip,steel);band.position.set(side*.26,.24,0);root.add(band);const latch=new T.Mesh(lock,steel);latch.position.set(side*.22,.29,.274);root.add(latch);}
      for(const turn of [0,Math.PI/2]){const emblem=new T.Mesh(cross,s.kind==='medical'?red:mark);emblem.position.set(0,.438,0);emblem.rotation.y=turn;root.add(emblem);}
      const marker=new T.Mesh(ring,s.kind==='medical'?red:mark);marker.rotation.x=-Math.PI/2;marker.position.y=.04;root.add(marker);this.items.push({root,marker,crate});
    }
    scene.add(this.root);
  }
  update(supplies:Supply[],time:number){for(let i=0;i<this.items.length;i++){const v=this.items[i],s=supplies[i];v.root.visible=s.readyAt<=time;v.marker.scale.setScalar(1+Math.sin(time*2+i)*.04);}}
  dispose(){this.root.removeFromParent();for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();}
}

export function createGrenade(){
  const root=new T.Group(),shell=finishMaterial(new T.MeshStandardMaterial({color:0x607153,roughness:.72,metalness:.4}),'polymer'),metal=new T.MeshStandardMaterial({color:0x879283,roughness:.36,metalness:.8});
  const body=new T.Mesh(new T.SphereGeometry(.095,12,9),shell);body.scale.set(.85,1.17,.85);root.add(body);
  const collar=new T.Mesh(new T.CylinderGeometry(.04,.055,.065,10),metal);collar.position.y=.112;root.add(collar);
  const lever=new T.Mesh(new T.BoxGeometry(.023,.028,.14),metal);lever.position.set(0,.15,-.025);lever.rotation.x=.3;root.add(lever);
  for(let i=0;i<5;i++){const band=new T.Mesh(new T.TorusGeometry(.075+Math.sin(i/4*Math.PI)*.008,.004,4,12),metal);band.rotation.x=Math.PI/2;band.position.y=-.07+i*.037;root.add(band);}
  const fuse=new T.Mesh(new T.SphereGeometry(.013,6,4),new T.MeshStandardMaterial({color:0xe79765,emissive:0xff5d32,emissiveIntensity:1,roughness:.4}));fuse.name='fuse-light';fuse.position.set(.028,.145,.018);root.add(fuse);
  const pin=new T.Mesh(new T.TorusGeometry(.03,.006,5,12),metal);pin.position.set(.055,.135,0);pin.rotation.y=Math.PI/2;root.add(pin);
  root.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});return root;
}
export function disposeEquipment(root:T.Group){
  const materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const m of materials)m.dispose();
}
