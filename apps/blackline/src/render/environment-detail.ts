import { seeded } from '../math.ts';
import type { MapData } from '../types.ts';
import { Batch,material } from './primitives.ts';
export function environmentDetails(map:MapData,b:Batch,detail:Batch){
  const metal=material(0x545c50,0,1),trim=material(0x858b77,.5,.5),shadow=metal,ochre=trim,rand=seeded(map.id==='harbor'?1808:2808);
  for(const p of map.props){if(p.kind!=='building'||p.y!==undefined)continue;
    // Small facade-mounted details stay inside the existing building's collision footprint.
    const x=p.x-p.w*.36,z=p.z+p.d/2+.025;
    detail.box(.075,p.h-.35,.055,x,p.h*.49,z,metal);detail.box(.23,.11,.16,x+.08,.16,z+.02,metal);
    for(let y=.5;y<p.h;y+=1.45){detail.box(.19,.045,.055,x,y,z+.035,trim);for(const dx of [-.08,.08])detail.box(.017,.033,.013,x+dx,y,z+.073,shadow);}
    const units=Math.max(1,Math.floor(p.w/5));for(let i=0;i<units;i++){
      const ux=p.x+p.w*.05+i*1.1,uy=p.h*.5;
      detail.box(.7,.44,.15,ux,uy,z+.07,trim);for(let q=0;q<6;q++)detail.box(.59,.016,.028,ux,uy-.16+q*.062,z+.16,shadow);
      detail.box(.54,.018,.2,ux,uy-.245,z+.05,metal);detail.box(.045,.3,.035,ux-.3,uy-.15,z,metal);
    }
    for(const side of [-1,1])for(let y=.3;y<p.h-.1;y+=1.1)detail.box(.065,.2,.035,p.x+side*(p.w/2-.08),y,z,trim);
    detail.box(.45,.29,.035,p.x+p.w*.32,1.5,z+.055,ochre);detail.box(.25,.04,.014,p.x+p.w*.32,1.5,z+.08,shadow);
    // Roof vents are visual grills on existing solid roof fixtures.
    for(let i=0;i<2;i++){const rx=p.x+(i?1:-1)*p.w*.22,rz=p.z-p.d*.25;detail.box(.65,.025,.65,rx,p.h+.03,rz,shadow);for(let q=0;q<7;q++)detail.box(.57,.03,.025,rx,p.h+.06,rz-.25+q*.08,trim);}
  }
  // Flush grates and painted service markings do not obstruct movement.
  for(const side of [-1,1])for(let z=-24;z<=24;z+=12){const x=side*6.2;b.box(.7,.013,.55,x,.035,z,material(0x29332f,.2,.9));for(let i=0;i<6;i++)detail.box(.06,.018,.48,x-.25+i*.1,.046,z,trim);}
  for(let i=0;i<25;i++){const x=(rand()-.5)*70,z=(rand()-.5)*58;detail.box(.02,.009,.45+rand()*.7,x,.027,z,shadow,rand()*Math.PI);}
}
