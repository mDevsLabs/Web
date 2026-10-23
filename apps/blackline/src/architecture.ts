import type * as T from 'three';
import { buildingDressing } from './render/building-dressing.ts';
import { interiorFacade } from './render/interior-facade.ts';
import { buildingLadder } from './traversal.ts';
import type { Prop } from './types.ts';
import type { Batch } from './world.ts';

export interface FacadePalette {wall:T.Material;trim:T.Material;glass:T.Material;door:T.Material;foundation:T.Material;metal:T.Material;weather:T.Material;ladder:T.Material;marker:T.Material;}
export function buildingFacade(p:Prop,b:Batch,detail:Batch,m:FacadePalette){
  const {x,z,w,d,h}=p;
  buildingDressing(p,detail,m);
  if(p.enterable){interiorFacade(p,b,detail,m);ladderFacade(p,b,m);return;}
  b.box(w,h,d,x,h/2,z,m.wall,0,0,true);
  // The roof slab and parapets are rendered from the same props used by physics.
  b.box(w+.1,.28,d+.1,x,.14,z,m.foundation);
  for(const side of [-1,1]){
    b.box(w,.1,.035,x,.34,z+side*(d/2+.023),m.weather);
    b.box(w,.18,.12,x,h*.48,z+side*(d/2+.025),m.trim);
    b.box(.12,.18,d,x+side*(w/2+.025),h*.48,z,m.trim);
    for(const xx of [-1,1])b.box(.18,h,.18,x+xx*(w/2-.05),h/2,z+side*(d/2-.04),m.trim);
  }
  const window=(along:number,y:number,side:number,axis:'x'|'z')=>{
    const isFront=axis==='x',px=isFront?x+along:x+side*(w/2+.04),pz=isFront?z+side*(d/2+.04):z+along,ry=isFront?0:Math.PI/2;
    b.box(1.22,1.5,.08,px,y,pz,m.trim,ry);
    b.box(1.04,1.31,.09,px+(isFront?0:side*.02),y,pz+(isFront?side*.02:0),m.glass,ry);
    b.box(.035,1.33,.12,px,y,pz,m.trim,ry);b.box(1.08,.035,.12,px,y+.15,pz,m.trim,ry);
    b.box(1.35,.07,.25,px,y-.79,pz,m.foundation,ry);
    detail.box(.9,.012,.008,px+(isFront?-.1:side*.06),y-.15,pz+(isFront?side*.06:0),m.weather,ry);
  };
  const levels=h>7?[3.95,h-1.65]:[Math.max(3.5,h-1.4)];
  for(const y of levels){if(y+.85>h)continue;
    for(let along=-w/2+1.5;along<w/2-.8;along+=2.5)for(const side of [-1,1])if(y>3.6||Math.abs(along)>1.5)window(along,y,side,'x');
    for(let along=-d/2+1.4;along<d/2-.8;along+=2.5)for(const side of [-1,1])window(along,y,side,'z');
  }
  b.box(2.55,3,.11,x,1.5,z+d/2+.07,m.trim);b.box(2.28,2.8,.13,x,1.4,z+d/2+.08,m.door);
  for(let y=.2;y<2.8;y+=.19)b.box(2.22,.018,.025,x,y,z+d/2+.156,m.metal);
  b.box(2.85,.14,.6,x,3.04,z+d/2+.25,m.trim);b.box(.18,.08,.08,x+.85,1.1,z+d/2+.16,m.metal);
  for(let i=0;i<6;i++)detail.box(1.62,.035,.04,x+w*.2,h+.35+i*.09,z+.77,m.metal);
  // Small rooftop and façade details share material batches, not one draw per part.
  for(const side of [-1,1]){
    detail.cylinder(.055,h-.1,x+side*(w/2+.065),h/2,z+d/2+.1,m.metal);
    detail.box(.17,.04,.17,x+side*(w/2+.065),.2,z+d/2+.1,m.metal);
    for(let y=.65;y<h;y+=1.2)detail.box(.09,.06,.22,x+side*(w/2+.055),y,z+d/2+.065,m.trim);

  }
  ladderFacade(p,b,m);
  detail.box(.55,.65,.28,x+w/2+.15,2.9,z-d*.2,m.door);for(let i=0;i<7;i++)detail.box(.015,.48,.025,x+w/2+.44,2.9,z-d*.2-.09+i*.03,m.metal);
  for(let i=0;i<5;i++){const along=-w/2+.7+i*(w-1.4)/5;detail.box(.13+i*.028,h*.28,.012,x+along,h*.23,z+d/2+.006,m.weather);}
}

function ladderFacade(p:Prop,b:Batch,m:FacadePalette){const {x,z,w,d,h}=p;
  const ladder=buildingLadder(p),ladderX=ladder.x,ladderZ=ladder.z;
  for(const side of [-1,1])b.cylinder(.045,h+1.2,ladderX+side*.36,(h+1.2)/2,ladderZ,m.ladder);
  for(let y=.35;y<h+.7;y+=.35)b.box(.76,.05,.08,ladderX,y,ladderZ,m.ladder);
  for(const side of [-1,1]){b.box(.12,.045,1.15,ladderX+side*.58,.028,ladderZ+.4,m.marker);b.box(.12,.04,1.25,ladderX+side*.58,h+.245,z+d/2-.5,m.marker);}
  for(let y=.7;y<h;y+=1.4)for(const side of [-1,1])b.box(.09,.09,.6,ladderX+side*.36,y,ladderZ-.3,m.metal);
  b.box(1.15,.06,.12,ladderX,.04,ladderZ+.9,m.marker);
}
