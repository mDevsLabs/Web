import * as T from 'three';
import { seeded } from '../math.ts';
import type { Prop } from '../types.ts';
import { environmentMaps } from './environment-surfaces.ts';
import { Batch } from './primitives.ts';
const palettes=new Map<string,{bark:T.MeshStandardMaterial;leaves:T.MeshStandardMaterial}>();
function palette(harbor:boolean){const key=String(harbor);let p=palettes.get(key);if(!p){const maps=environmentMaps('bark');p={bark:new T.MeshStandardMaterial({color:0x756957,map:maps.color,normalMap:maps.normal,roughnessMap:maps.roughness,roughness:.94}),leaves:new T.MeshStandardMaterial({color:harbor?0x758a55:0x9c965c,roughness:.94,vertexColors:true})};palettes.set(key,p);}return p;}
export function tree(p:Prop,b:Batch,detail:Batch,harbor:boolean){
  const {x,z,h}=p,{bark,leaves}=palette(harbor),rand=seeded(Math.round((x+100)*739+(z+100)*139));
  b.cylinder(.27,h*.88,x,h*.44,z,bark);
  for(let i=0;i<7;i++){
    const angle=i*2.399,reach=.75+rand()*.9,y=h*.62+rand()*h*.30;
    const branch=new T.CylinderGeometry(.045,.11,reach*1.4,8);branch.rotateZ(-.8);branch.rotateY(-angle);branch.translate(x+Math.cos(angle)*reach*.45,y-.24,z+Math.sin(angle)*reach*.45);b.add(branch,bark);
    const crown=new T.IcosahedronGeometry(1.35+rand()*.4,2),pos=crown.attributes.position,colors=new Float32Array(pos.count*3);
    for(let n=0;n<pos.count;n++){
      const px=pos.getX(n),py=pos.getY(n),pz=pos.getZ(n),r=1+Math.sin(px*7+py*4+pz*9)*.10;
      pos.setXYZ(n,px*r,py*r*.83,pz*r);
      const light=.65+Math.max(0,py)*.16+(Math.sin(px*19+pz*21)*.5+.5)*.22;
      colors[n*3]=light*.92;colors[n*3+1]=light;colors[n*3+2]=light*.78;
    }
    crown.setAttribute('color',new T.BufferAttribute(colors,3));crown.computeVertexNormals();crown.translate(x+Math.cos(angle)*reach,y,z+Math.sin(angle)*reach);b.add(crown,leaves);
  }
  // Roots, without changing the trunk's collision footprint.
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;detail.box(.09,.14,.55,x+Math.sin(angle)*.2,.08,z+Math.cos(angle)*.2,bark,angle);}
}
