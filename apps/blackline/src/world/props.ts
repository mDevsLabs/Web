import * as T from 'three';
import { environmentMaps } from '../render/environment-surfaces.ts';
import { tree } from '../render/vegetation.ts';
import { buildingFacade } from '../architecture.ts';
import { Batch,material,meshBox,meshCylinder } from '../render/primitives.ts';
import { SignAtlas } from '../render/sign-atlas.ts';
import { buildingLadder } from '../traversal.ts';
import type { Prop } from '../types.ts';
import type { World } from '../world.ts';
export function prop(this:World,p:Prop,b:Batch,metal:T.Texture,concrete:T.Material,detail:Batch,accent:T.Material){
    if(p.collisionOnly)return;
    const {x,z,w,d,h}=p,c=p.color??0x7a7356,mat=material(c,p.kind==='container'?.35:.08,.8),edge=material(p.kind==='container'?new T.Color(c).multiplyScalar(.65).getHex():0x555d50,.35,.6);
    if(p.kind==='tree'){tree(p,b,detail,this.map.id==='harbor'||this.map.id==='forest');return;}
    if(p.y!==undefined){
      b.box(w,h,d,x,p.y+h/2,z,mat);
      if(h>.6){for(let i=0;i<6;i++)detail.box(w*.86,.035,.025,x,p.y+.14+i*.09,z+d/2+.02,edge);b.box(w+.05,.06,d+.05,x,p.y+h,z,edge);}
      return;
    }
    if(p.kind==='barrier'){
      b.box(w,h*.85,d*.8,x,h*.43,z,concrete);b.box(w,h*.2,d,x,h*.1,z,concrete);b.box(w*.94,.1,d*.86,x,h*.87,z,material(0xb49c59));for(let i=0;i<Math.floor(w/.6);i++)b.box(.24,h*.55,.026,x-w/2+.35+i*.6,h*.48,z+d*.405,edge,0,.24);
    }else if(p.kind==='container'){
      const containerMat=new T.MeshStandardMaterial({color:c,map:metal,metalness:.4,roughness:.75});this.owned.push(containerMat);b.box(w,h,d,x,h/2,z,containerMat);
      const count=Math.floor(w/.32);for(let i=0;i<count;i++){const xx=x-w/2+.16+i*.32;b.box(.05,h-.2,.045,xx,h/2,z+d/2+.01,edge);b.box(.05,h-.2,.045,xx,h/2,z-d/2-.01,edge);}
      for(const side of [-1,1]){b.box(w+.06,.1,.13,x,.11,z+side*d/2,edge);b.box(w+.06,.1,.13,x,h-.1,z+side*d/2,edge);b.box(.11,h,.11,x+side*w/2,h/2,z-d/2,edge);b.box(.11,h,.11,x+side*w/2,h/2,z+d/2,edge);}
      for(const side of [-1,1])for(let i=0;i<3;i++)b.box(.035,h*.8,.035,x+side*w/2+side*.03,h*.5,z-d/2+.45+i*(d-1)/2,edge);
      if(p.label)this.sign(p.label,w>6?3:2,.58,x,h*.7,z+d/2+.04,0,0xc5d2bc,0x263c3a);
    }else if(p.kind==='building'){
      const maps=environmentMaps('masonry'),wall=new T.MeshStandardMaterial({color:new T.Color(c).lerp(new T.Color(0xffffff),.3),map:maps.color,normalMap:maps.normal,normalScale:new T.Vector2(.48,.48),roughnessMap:maps.roughness,roughness:.94});this.owned.push(wall);
      buildingFacade(p,b,detail,{wall,trim:edge,foundation:concrete,glass:material(0x45646a,.5,.25),door:material(0x34403f,.5,.5),metal:material(0x858b77,.5,.5),weather:material(0x545c50,0,1),ladder:accent,marker:accent});
      this.sign(p.label??'09',Math.min(4,w*.6),.75,x,h-.68,z+d/2+.16,0,0xd7dbca,0x384239);
      b.cylinder(.08,2,x-w*.25,h+1,z-d*.25,edge);
      const ladder=buildingLadder(p);this.sign('ACCÈS TOIT',1.55,.44,ladder.x+1.3,1.85,z+d/2+.17,0,0xc6dd94,0x1c3430);
      this.sign('OBSERVATION / '+(p.label??'09'),Math.min(3,w*.4),.42,x+.4,h+.46,z+d*.28+.35,0,0xc6dd94,0x1c3430);
    }else if(p.kind==='truck'){
      const length=Math.max(w,d),rot=d>w?Math.PI/2:0;const group=new T.Group();group.position.set(x,0,z);group.rotation.y=rot;
      meshBox(length-1.5,1.7,2.55,-.6,1.77,0,c,group);meshBox(1.8,1.9,2.5,length/2-1,1.7,0,c,group);meshBox(length,.24,2.6,0,.75,0,0x252c26,group);meshBox(1.65,.8,.035,length/2-1,2.04,1.27,0x2a4144,group,.7,.15);meshBox(.035,.75,2.15,length/2-.075,2.02,0,0x31484a,group,.6,.1);
      for(const xx of [-length*.3,length*.3])for(const zz of [-1.27,1.27]){const tire=meshCylinder(.49,.49,.24,0x1a2322,group,xx,.51,zz,16);tire.rotation.x=Math.PI/2;const hub=meshCylinder(.21,.21,.26,0x646a61,group,xx,.51,zz,12);hub.rotation.x=Math.PI/2;}
      meshBox(.1,.2,2.3,length/2,.85,0,0x798278,group);for(const zz of [-.85,.85])meshBox(.04,.23,.28,length/2+.03,1.27,zz,0xb6b190,group);
      this.root.add(group);
    }else{
      b.box(w,h,d,x,h/2,z,mat);for(const xx of [-1,1])b.box(.13,h+.07,d+.05,x+xx*(w/2-.12),h/2,z,edge);for(const zz of [-1,1])b.box(w+.04,.13,.09,x,h*.2,z+zz*d/2,edge);b.box(w+.05,.13,d+.05,x,h*.85,z,edge);
      this.sign('MIL / '+Math.round(Math.abs(x*17)),Math.min(1.5,w*.6),.36,x,h*.54,z+d/2+.055,0,0xc5c9ad,0x585e48);
    }
  }
export function sign(this:World,text:string,w:number,h:number,x:number,y:number,z:number,ry:number,color:number,bg:number){if(!this.signAtlas){this.signAtlas=new SignAtlas(this.mobile);this.textures.push(this.signAtlas.texture);this.owned.push(this.signAtlas.material);}const mesh=this.signAtlas.sign(text,w,h,x,y,z,ry,color,bg);this.root.add(mesh);return mesh;}
