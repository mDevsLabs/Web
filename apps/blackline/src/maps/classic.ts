import type {Prop} from '../types.ts';
import {prop} from './props.ts';
export function classicProps(id:'harbor'|'outpost'):Prop[]{
  const harbor:Prop[]=[
    prop('building',-29,-23,13,12,10,0x626969,'09'),prop('building',29,23,13,12,10,0x5e6464,'04'),
    prop('building',-35,3,9,15,7,0x5f6560,'NEREIS'),prop('building',35,-3,9,15,7,0x626760,'SECURITY'),
    prop('container',-19,-6,12,3.6,3.4,0x2e5960,'NEREIS / 021'),prop('container',18,6,12,3.6,3.4,0x8d5141,'NEREIS / 017'),
    prop('container',-12,22,12,3.6,3.4,0x726e47,'NEREIS / 044'),prop('container',12,-22,12,3.6,3.4,0x334f5a,'NEREIS / 053'),
    prop('container',-22,15,3.6,10,3.4,0x874b3d,'06'),prop('container',22,-15,3.6,10,3.4,0x4d6660,'08'),
    prop('crate',-7,7,3,3,2.2,0x736d50),prop('crate',8,-7,3,3,2.2,0x736d50),
    prop('barrier',-1,13,7,1.25,1.1),prop('barrier',1,-13,7,1.25,1.1),
    prop('barrier',-15,-15,1.2,6,1.1),prop('barrier',15,15,1.2,6,1.1),
    prop('truck',-5,-27,6.5,3.1,3,0x666951),prop('truck',5,27,6.5,3.1,3,0x505a54),
    prop('crate',-30,17,2,2,1.6),prop('crate',30,-17,2,2,1.6),
    prop('wall',-2,-3,4.5,1,1.5),prop('wall',5,3,1,4.5,1.5),
    prop('crate',-28,-11,2.8,2.8,2),prop('crate',28,11,2.8,2.8,2),
  ];
  const outpost:Prop[]=[
    prop('building',-29,-22,12,13,7,0x9c927d,'KESTREL'),prop('building',29,22,12,13,7,0x918773,'B-02'),
    prop('building',-35,3,9,14,6,0x8f8675,'COMMS'),prop('building',35,-3,9,14,6,0x8f8675,'ARMORY'),
    prop('wall',-15,-6,13,1.7,2.5,0x8b8170),prop('wall',15,6,13,1.7,2.5,0x8b8170),
    prop('container',-11,22,11,3.6,3.1,0x737652,'AUX / 01'),prop('container',11,-22,11,3.6,3.1,0x696b52,'AUX / 02'),
    prop('truck',-23,14,3.5,7.5,3,0x515848),prop('truck',23,-14,3.5,7.5,3,0x565e4e),
    prop('barrier',-1,12,7,1.5,1.1),prop('barrier',1,-12,7,1.5,1.1),
    prop('crate',-7,4,3.2,3.2,2),prop('crate',7,-4,3.2,3.2,2),
    prop('barrier',-17,-15,1.3,7,1.1),prop('barrier',17,15,1.3,7,1.1),
    prop('crate',-29,18,2.2,2.2,1.5),prop('crate',29,-18,2.2,2.2,1.5),
    prop('wall',-2,-2,4.2,1.2,1.7),prop('wall',4,4,1.2,4.2,1.7),
    prop('crate',-27,-11,3,3,2.2),prop('crate',27,11,3,3,2.2),
  ];
  return id==='harbor'?harbor:outpost;
}
