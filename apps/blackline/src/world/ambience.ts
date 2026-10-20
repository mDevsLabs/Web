import * as T from 'three';
import { Batch,material } from '../render/primitives.ts';
import { waterFragment,waterVertex } from '../scenery.ts';
import type { World } from '../world.ts';
export function crane(this:World,x:number,z:number,b:Batch){const steel=material(0x56665e,.55,.62),orange=material(0xb5a46b,.3,.7);for(const side of [-1,1]){b.box(.75,30,.75,x+side*6,15,z,steel,0,side*.08);b.box(1.7,1.4,3,x+side*7,.7,z,steel);}b.box(16,1.2,1.2,x,29,z,orange);b.box(1,1,33,x,30,z+12,orange);for(let i=0;i<10;i++){b.box(1,.16,3.8,x,30.6,z+i*3,steel,0,.03);b.box(.05,29,.05,x+.3,15,z+18,steel);}b.box(3,2.2,3,x,28,z+2,steel);b.box(6,.6,1,x,1,z+18,orange);}
export function radar(this:World,x:number,z:number,b:Batch){const m=material(0x6f7366,.4,.6);b.box(8,2,8,x,1,z,m);b.cylinder(.5,13,x,8,z,m);const dish=new T.Mesh(new T.SphereGeometry(5,16,12,0,Math.PI*2,0,Math.PI*.45),m);dish.position.set(x,15,z);dish.rotation.x=-.7;this.root.add(dish);b.box(.2,5,.2,x,15,z,m);}
export function ocean(this:World){
    const mat=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:waterVertex,fragmentShader:waterFragment});this.water=mat;this.owned.push(mat);
    const ocean=new T.Mesh(new T.PlaneGeometry(300,300,72,72),mat);ocean.rotation.x=-Math.PI/2;ocean.position.set(-170,-.9,30);this.root.add(ocean);
  }
export function atmosphere(this:World,rand:()=>number,harbor:boolean){
    const geom=new T.BufferGeometry(),positions=new Float32Array(220*3);for(let i=0;i<220;i++){positions[i*3]=(rand()-.5)*150;positions[i*3+1]=rand()*25+1;positions[i*3+2]=(rand()-.5)*130;}geom.setAttribute('position',new T.BufferAttribute(positions,3));
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#ffffffbb');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const tex=new T.CanvasTexture(c);this.textures.push(tex);const mat=new T.PointsMaterial({color:harbor?0xc8d7d5:0xd1bd99,map:tex,size:harbor?.15:.22,transparent:true,opacity:.35,depthWrite:false});this.owned.push(mat);this.dust=new T.Points(geom,mat);this.root.add(this.dust);
    const smoke=new T.Group();const smat=new T.MeshBasicMaterial({color:0x889491,transparent:true,opacity:.055,depthWrite:false});this.owned.push(smat);for(let i=0;i<9;i++){const sphere=new T.Mesh(new T.SphereGeometry(2+i*.8,8,6),smat);sphere.position.set(-31+i*.6,12+i*1.6,-23);smoke.add(sphere);}this.root.add(smoke);
  }