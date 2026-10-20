import type { Actor } from './ai.ts';
export function steerCrowd(actor:Actor,x:number,z:number,actors:Actor[]){
  const speed=Math.hypot(x,z);if(speed<.1)return {x,z};const fx=x/speed,fz=z/speed;
  for(const other of actors){if(other===actor||!other.alive||Math.abs(other.y-actor.y)>1.4)continue;
    const dx=other.x-actor.x,dz=other.z-actor.z,ahead=dx*fx+dz*fz,lateral=dx*fz-dz*fx;
    if(ahead>.1&&ahead<1.9&&Math.abs(lateral)<.8){const side=Math.abs(lateral)>.15?(lateral>0?-1:1):(actor.id<other.id?-1:1),force=(1.9-ahead)*.48;x+=fz*side*force;z-=fx*side*force;}
  }return {x,z};
}
