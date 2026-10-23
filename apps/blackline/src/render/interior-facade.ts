import type { FacadePalette } from '../architecture.ts';
import { interiorProps,UPPER_FLOOR } from '../interiors.ts';
import type { Prop } from '../types.ts';
import type { Batch } from './primitives.ts';
export function interiorFacade(p:Prop,b:Batch,detail:Batch,m:FacadePalette){
  for(const box of interiorProps(p))b.box(box.w,box.h,box.d,box.x,(box.y??0)+box.h/2,box.z,m.wall,0,0,true);
  const {x,z,w,d,h}=p;
  for(const side of [-1,1]){
    for(const axis of ['x','z'] as const){const centers=axis==='x'?[-w*.29,w*.29]:[-d*.28,d*.28];for(const center of centers)for(const floor of [0,UPPER_FLOOR]){
      const px=axis==='x'?x+center:x+side*w/2,pz=axis==='x'?z+side*d/2:z+center,ry=axis==='x'?0:Math.PI/2;
      // Frames and sill only: no plate or opaque glass across the firing opening.
      for(const dx of [-.77,.77])b.box(.1,1.65,.28,px+(axis==='x'?dx:0),floor+1.74,pz+(axis==='z'?dx:0),m.trim,ry);
      for(const y of [floor+.94,floor+2.54])b.box(1.64,.1,.34,px,y,pz,m.trim,ry);
      detail.box(1.7,.045,.48,px,floor+.89,pz,m.foundation,ry);
    }}
    b.box(w,.16,.3,x,UPPER_FLOOR,z+side*d/2,m.trim);b.box(.3,.16,d,x+side*w/2,UPPER_FLOOR,z,m.trim);
    for(const xx of [-1,1])b.box(.2,h,.2,x+xx*(w/2-.03),h/2,z+side*(d/2-.03),m.trim);
    for(const dx of [-1.26,1.26])b.box(.12,2.72,.28,x+dx,1.36,z+side*d/2,m.trim);
    b.box(2.65,.12,.4,x,2.7,z+side*d/2,m.trim);
  }
  // Lighting strips and skirting describe the rooms without adding point lights.
  for(const floor of [0,UPPER_FLOOR])for(const side of [-1,1]){b.box(.08,.09,d-.5,x+side*(w/2-.16),floor+.13,z,m.trim);detail.box(2.3,.04,.25,x,floor+2.92,z,m.marker);}
  for(let i=0;i<24;i++)detail.box(1.5,.016,.045,x+w/2-1.4,(i+1)*UPPER_FLOOR/24+.012,z+d/2-1.4-(d-2.8)/24*(i+1),m.trim);
  // Stair handrail beside the opening; no collision above the actual steps.
  for(let i=0;i<7;i++)detail.cylinder(.025,.8,x+w/2-2.29,i*UPPER_FLOOR/6+.4,z+d/2-1.4-(d-2.8)*i/6,m.metal);
  for(let i=0;i<6;i++)detail.box(.045,.04,(d-2.8)/6+.04,x+w/2-2.29,(i+.5)*UPPER_FLOOR/6+.8,z+d/2-1.4-(d-2.8)*(i+.5)/6,m.metal);
}
