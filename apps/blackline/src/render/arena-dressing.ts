import * as T from 'three';
import type {MapData} from '../types.ts';
import {Batch,material} from './primitives.ts';
export function arenaDressing(map:MapData,b:Batch,detail:Batch){
 const steel=material(0x545c50,0,1),rust=material(0x87563f,.5,.75),concrete=material(0x969180,0,1);
 if(map.id==='foundry'){
  for(const side of [-1,1]){
   // Tracks are flush to the ground and form two readable routes through the yard.
   for(const x of [-2.3,2.3])b.box(.11,.035,map.depth-10,side*14+x,.045,0,steel);
   for(let z=-map.depth/2+6;z<map.depth/2-4;z+=1.6)detail.box(5.3,.035,.22,side*14,.025,z,rust);
   for(const z of [-30,22]){const x=side*(map.width/2+12);b.cylinder(3.1,18,x,9,z,rust);b.cylinder(1.3,30,x+side*8,15,z+5,steel);for(let y=4;y<28;y+=5)detail.cylinder(1.34,.3,x+side*8,y,z+5,rust);b.box(15,.3,.3,x+side*4,14,z,steel);}
   for(let z=-40;z<45;z+=16)detail.box(1.1,.02,.18,side*7.5,.047,z,material(0xb49c59));
  }
 }else if(map.id==='forest'){
  const bark=material(0x5e5943,0,1),leaves=material(0x667958,0,1);
  for(let i=0;i<32;i++){const angle=i*Math.PI*2/32,x=Math.cos(angle)*(map.width/2+16),z=Math.sin(angle)*(map.depth/2+17),h=10+(i%4)*2;b.cylinder(.28,h,x,h/2,z,bark);const crown=new T.IcosahedronGeometry(3.8,1);crown.scale(1,1.4,1);crown.translate(x,h,z);b.add(crown,leaves);}
  for(const side of [-1,1])for(let z=-42;z<45;z+=9){detail.box(.14,.55,.14,side*6,.275,z,bark);detail.box(.15,.05,.15,side*6,.48,z,concrete);}
 }else if(map.id==='outpost'){
  // Dry service paths contrast with harbor paint and loading zones.
  for(const side of [-1,1])for(let z=-40;z<45;z+=10){detail.box(.6,.02,.5,side*11,.043,z,concrete);detail.box(.6,.02,.5,side*12,.043,z+1,concrete);}
 }else{
  for(const side of [-1,1])for(let z=-35;z<=35;z+=7){detail.box(.18,.025,1.7,side*7,.04,z,material(0xb49c59));detail.box(.18,.025,1.7,side*8,.04,z,material(0xb49c59));}
 }
}
