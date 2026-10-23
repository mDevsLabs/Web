import type { FacadePalette } from '../architecture.ts';
import type { Prop } from '../types.ts';
import type { Batch } from './primitives.ts';
export function buildingDressing(p:Prop,detail:Batch,m:FacadePalette){
  const {x,z,w,d,h}=p;
  // Shallow coping and expansion joints retain the openings used by collision and shots.
  for(const side of [-1,1]){
    if(!p.enterable)for(let y=.6;y<h;y+=.62){detail.box(.025,.018,d-.4,x+side*(w/2+.015),y,z,m.weather);detail.box(w-.4,.018,.025,x,y,z+side*(d/2+.015),m.weather);}
    detail.box(w+.13,.055,.23,x,h-.04,z+side*(d/2+.025),m.foundation);
    detail.box(.23,.055,d+.13,x+side*(w/2+.025),h-.04,z,m.foundation);
    for(let q=-w/2+.6;q<w/2-.3;q+=1.8){
      if(!p.enterable)detail.box(.022,h*.17,.008,x+q,h*.08,z+side*(d/2+.022),m.weather);
      detail.box(.045,.045,.025,x+q,h-.24,z+side*(d/2+.025),m.metal);
    }
    // Mounts and conduits close to the side wall, clear of every window.
    const px=x+side*(w/2+.06),pz=z-d*.44;
    detail.cylinder(.022,h-.4,px,h/2,pz,m.metal);
    for(let y=.4;y<h;y+=1.1){detail.box(.1,.035,.11,px,y,pz,m.trim);detail.box(.012,.023,.015,px+side*.055,y,pz,m.metal);}
  }
  // Fasteners and seams lie on the existing rooftop slab; no new obstacles.
  for(let along=-w/2+.8;along<w/2-.5;along+=1.5){detail.box(.018,.012,d-.8,x+along,h+.014,z,m.weather);for(const side of [-1,1])detail.box(.05,.018,.05,x+along,h+.023,z+side*(d/2-.5),m.metal);}
  if(p.enterable){for(const floor of [0,3.28])for(const side of [-1,1]){
    detail.box(w-.5,.055,.03,x,floor+.2,z+side*(d/2-.13),m.trim);
    detail.box(w-.5,.08,.04,x,floor+2.8,z+side*(d/2-.14),m.foundation);
    for(let i=0;i<4;i++)detail.box(.02,.004,d*.55,x-w*.3+i*w*.2,floor+.012,z,m.weather);
  }}
}
