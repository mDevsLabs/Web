import * as T from 'three';
import { environmentMaps } from '../render/environment-surfaces.ts';
import { meshCylinder } from '../render/primitives.ts';
import { surfaceMaps } from '../surfaces.ts';
import type { Quality } from '../types.ts';
import type { World } from '../world.ts';
export function objective(this:World,x:number,z:number,id:string){
    const root=new T.Group();root.position.set(x,0,z);
    const ringMat=new T.MeshBasicMaterial({color:0xb5c9c6,transparent:true,opacity:.4,depthWrite:false}),ring=new T.Mesh(new T.RingGeometry(3.55,3.65,64),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.055;root.add(ring);this.owned.push(ringMat);
    meshCylinder(.036,.036,3.2,0x343e39,root,0,1.6,0,8);
    const flagMat=new T.MeshStandardMaterial({color:0xa9bbb7,side:T.DoubleSide,roughness:1}),flag=new T.Mesh(new T.PlaneGeometry(1,.6,6,3),flagMat);flag.position.set(.52,2.75,0);root.add(flag);this.owned.push(flagMat);
    const beamMat=new T.MeshBasicMaterial({color:0x9cb8ae,transparent:true,opacity:.027,side:T.DoubleSide,depthWrite:false}),beam=new T.Mesh(new T.CylinderGeometry(.6,.6,18,16,1,true),beamMat);beam.position.y=9;root.add(beam);this.owned.push(beamMat);
    this.objectives.push({root,ring,flag,beam});this.root.add(root);const label=this.sign(id,.55,.55,0,3.7,.01,0,0xc9dfbb,0x253c36);root.add(label);
  }
export function update(this:World,dt:number){this.time+=dt;if(this.water)this.water.uniforms.time.value=this.time;if(this.sky)this.sky.uniforms.time.value=this.time;if(this.dust)this.dust.rotation.y=this.time*.002;for(const flag of [...this.objectives.map(o=>o.flag),...this.sceneryFlags]){const p=flag.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*5+this.time*2.8)*.07*(p.getX(i)+.55));p.needsUpdate=true;}for(const o of this.objectives){o.beam.scale.x=o.beam.scale.z=1+Math.sin(this.time*2)*.06;}}
export function setObjectivesVisible(this:World,v:boolean,active?:number){for(let i=0;i<this.objectives.length;i++)this.objectives[i].root.visible=v&&(active===undefined||active===i);}
export function setQuality(this:World,quality:Quality){this.details.visible=quality!=='performance';const shared=(['metal','polymer','fabric','camo'] as const).flatMap(k=>Object.values(surfaceMaps(k))).concat(...(['masonry','asphalt','bark','sand'] as const).map(k=>Object.values(environmentMaps(k))));for(const t of [...this.textures,...shared]){const density=quality==='performance'?2:8;if(t.anisotropy!==density){t.anisotropy=density;t.needsUpdate=true;}}if(this.dust)(this.dust.material as T.PointsMaterial).opacity=quality==='performance'?.16:.27;}
export function setObjective(this:World,index:number,owner:number,contested:boolean){const color=contested?0xe6c171:owner===0?0xaacb79:owner===1?0xe68c67:0x9bb4b2;const o=this.objectives[index];for(const m of [o.ring,o.flag,o.beam]){(m.material as T.MeshBasicMaterial).color.setHex(color);}o.ring.rotation.z=this.time*.05;}