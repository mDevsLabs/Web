import * as T from 'three';
import { tracerSegment } from '../combat-motion.ts';
import type { Effects } from '../effects.ts';
import type { Vec3 } from '../types.ts';
type Particle={life:number;max:number;x:number;y:number;z:number;vx:number;vy:number;vz:number;size:number;gravity:number;};
type Tracer={width?:number;mesh:T.Mesh;age:number;fresh:boolean;from:Vec3;to:Vec3};
const up=new T.Vector3(0,1,0);
export function update(this:Effects,dt:number){
    for(let i=0;i<this.particles.length;i++){const p=this.particles[i];this.integrate(p,dt);this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(p.life*13,p.life*9,0);this.dummy.scale.setScalar(p.life>0?p.size*Math.min(1,p.life/.15):0);this.dummy.updateMatrix();this.pool.setMatrixAt(i,this.dummy.matrix);}this.pool.instanceMatrix.needsUpdate=true;
    const g=this.smokeCloud.geometry,pos=g.attributes.position as T.BufferAttribute,size=g.attributes.aSize as T.BufferAttribute,alpha=g.attributes.aAlpha as T.BufferAttribute,tint=g.attributes.aTint as T.BufferAttribute;
    for(let i=0;i<this.smoke.length;i++){const p=this.smoke[i];this.integrate(p,dt);const age=1-p.life/p.max;pos.setXYZ(i,p.x,p.y,p.z);size.setX(i,p.size*(1+age*2));alpha.setX(i,p.life>0?Math.min(1,age*8)*Math.min(1,p.life/.3)*.28:0);tint.setXYZ(i,p.color.r,p.color.g,p.color.b);}for(const a of [pos,size,alpha,tint])a.needsUpdate=true;this.smokeCloud.material.uniforms.time.value+=dt;
    for(let i=0;i<this.shells.length;i++){const s=this.shells[i];this.integrate(s,dt);s.rotation+=s.spin*dt;this.dummy.position.set(s.x,s.y,s.z);this.dummy.rotation.set(s.rotation,s.rotation*.6,s.rotation*.3);this.dummy.scale.setScalar(s.life>0?1:0);this.dummy.updateMatrix();this.shellPool.setMatrixAt(i,this.dummy.matrix);}this.shellPool.instanceMatrix.needsUpdate=true;
    for(const t of this.tracers){if(t.age>=.05)continue;if(t.fresh){t.fresh=false;continue;}t.age+=dt;if(t.age>=.05){t.mesh.visible=false;continue;}const segment=tracerSegment(t.from,t.to,Math.min(.035,t.age+.02),.035);this.placeTracer(t,segment.start,segment.end);}
    for(const m of this.marks)if(m.life>0){m.life-=dt;if(m.life<=0)m.mesh.visible=false;}
    for(const m of this.muzzles)if(m.life>0){m.life-=dt;if(m.life<=0)m.root.visible=false;}
    for(const w of this.waves){if(w.age>=.65)continue;w.age+=dt;w.mesh.scale.setScalar(.2+w.age*12);w.mesh.material.opacity=Math.max(0,.34*(1-w.age/.65));w.mesh.visible=w.age<.65;}
    this.flash.intensity*=Math.exp(-dt*22);
  }
export function integrate(this:Effects,p:Particle,dt:number){if(p.life<=0)return;p.life=Math.max(0,p.life-dt);p.vy-=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.035){p.y=.035;p.vy=Math.abs(p.vy)*.24;p.vx*=.88;p.vz*=.88;}}
export function placeTracer(this:Effects,t:Tracer,a:Vec3,b:Vec3){this.direction.set(b.x-a.x,b.y-a.y,b.z-a.z);const length=this.direction.length();t.mesh.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);t.mesh.scale.set(t.width??1,Math.max(.005,length),t.width??1);if(length>.00001)t.mesh.quaternion.setFromUnitVectors(up,this.direction.normalize());}
