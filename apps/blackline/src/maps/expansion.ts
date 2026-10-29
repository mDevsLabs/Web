import type {Prop} from '../types.ts';
import {prop} from './props.ts';
export function expansionProps(id:'forest'|'foundry'):Prop[]{
 const forest=id==='forest',props:Prop[]=forest?[
  prop('building',-35,-27,13,12,6.5,0x64735b,'GARDE 01'),prop('building',35,27,13,12,6.5,0x657462,'GARDE 02'),
  prop('building',-43,4,10,16,6,0x637465,'SYLVE'),prop('building',43,-4,10,16,6,0x607463,'RELAIS'),
  prop('building',-51,-42,11,10,6,0x72816c,'ANNEXE'),prop('building',51,42,11,10,6,0x72816c,'SENTINELLE'),
  prop('barrier',-14,-13,9,1.2,1.2,0x675b43),prop('barrier',14,13,9,1.2,1.2,0x675b43),
  prop('truck',-29,18,7,3.2,3,0x52644b),prop('truck',29,-18,7,3.2,3,0x52644b),
  prop('crate',-7,12,3,2.8,1.5,0x786e4f),prop('crate',7,-12,3,2.8,1.5,0x786e4f),
  prop('wall',-22,-5,1.3,8,1.2,0x68735d),prop('wall',22,5,1.3,8,1.2,0x68735d),
 ]:[
  prop('building',-34,-29,16,15,11,0x865d48,'HAUT FOURNEAU'),prop('building',34,29,16,15,11,0x7c5948,'ATELIER 02'),
  prop('building',-48,-5,11,18,7,0x80634e,'MAINTENANCE'),prop('building',48,5,11,18,7,0x80634e,'FRET'),
  prop('building',-52,-43,12,10,8,0x866753,'RÉSERVE'),prop('building',52,43,12,10,8,0x866753,'ÉNERGIE'),
  prop('wall',-11,-10,16,1.4,2.5,0x735b49),prop('wall',11,10,16,1.4,2.5,0x735b49),
  prop('container',-19,21,13,3.6,3.6,0x87563f,'FER / 04'),prop('container',19,-21,13,3.6,3.6,0x87563f,'FER / 08'),
  prop('container',-31,6,3.6,9,3.2,0x6e7473,'CARGO'),prop('container',31,-6,3.6,9,3.2,0x6e7473,'CARGO'),
  prop('truck',-12,35,7.5,3.2,3,0x6e6049),prop('truck',12,-35,7.5,3.2,3,0x6e6049),
  prop('barrier',-7,4,3.5,1.1,1.1),prop('barrier',7,-4,3.5,1.1,1.1),
 ];
 for(const side of [-1,1]){
  if(forest){for(let i=0;i<17;i++){const z=-46+i*5.7,x=side*(57+(i%3)*2);props.push(prop('tree',x,z,.75,.75,7+(i%4)*.8));}for(const [x,z] of [[10,27],[19,31],[9,37],[26,40],[17,43]] as const)props.push(prop('tree',side*x,side*z,.75,.75,7.5));}
  else for(const z of [-40,0,40])props.push(prop('tree',side*66,z,.65,.65,6));
  for(const z of [-43,43])props.push(prop('crate',side*22,z,2.8,2.8,1.8));
 }
 return props;
}
