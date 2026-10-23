import * as T from 'three';
import { effectColor } from '../lib/game/shop-catalog.js';
import * as effect_update from './render/effect-update.ts';
import type { Quality,Vec3 } from './types.ts';
import { createMuzzleFlash,setMuzzleColor } from './viewmodel.ts';

type Particle={life:number;max:number;x:number;y:number;z:number;vx:number;vy:number;vz:number;size:number;gravity:number;};
type Smoke=Particle&{color:T.Color};
type Shell=Particle&{rotation:number;spin:number};
type Tracer={width?:number;mesh:T.Mesh;age:number;fresh:boolean;from:Vec3;to:Vec3};
const empty=():Particle=>({life:0,max:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,gravity:0});
const up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1);

export class Effects {
  root=new T.Group();particles:Particle[]=[];pool:T.InstancedMesh;cursor=0;tracers:Tracer[]=[];tracerCursor=0;
  smoke:Smoke[]=[];smokeCursor=0;smokeCloud:T.Points<T.BufferGeometry,T.ShaderMaterial>;
  shells:Shell[]=[];shellCursor=0;shellPool:T.InstancedMesh;
  marks:{mesh:T.Mesh;life:number}[]=[];markCursor=0;muzzles:{root:T.Group;life:number}[]=[];muzzleCursor=0;
  waves:{mesh:T.Mesh<T.RingGeometry,T.MeshBasicMaterial>;age:number}[]=[];waveCursor=0;
  flash:T.PointLight;dummy=new T.Object3D();quality:Quality='balanced';color=new T.Color();direction=new T.Vector3();
  constructor(scene:T.Scene,capacity=240){
    this.pool=new T.InstancedMesh(new T.OctahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xffffff}),capacity);
    this.pool.instanceMatrix.setUsage(T.DynamicDrawUsage);this.pool.frustumCulled=false;
    this.dummy.scale.setScalar(0);this.dummy.updateMatrix();
    for(let i=0;i<capacity;i++){this.particles.push(empty());this.pool.setMatrixAt(i,this.dummy.matrix);this.pool.setColorAt(i,this.color.setHex(0xffcd72));}this.root.add(this.pool);
    const geom=new T.CylinderGeometry(.011,.011,1,4),mat=new T.MeshBasicMaterial({color:0xffd9a2,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending});
    for(let i=0;i<(capacity<240?24:48);i++){const mesh=new T.Mesh(geom,mat.clone());mesh.visible=false;this.root.add(mesh);this.tracers.push({mesh,age:1,fresh:false,from:{x:0,y:0,z:0},to:{x:0,y:0,z:0}});}
    const count=capacity<240?48:96,geometry=new T.BufferGeometry();
    for(const [name,itemSize]of [['position',3],['aTint',3],['aSize',1],['aAlpha',1]] as const)geometry.setAttribute(name,new T.BufferAttribute(new Float32Array(count*itemSize),itemSize).setUsage(T.DynamicDrawUsage));
    const smokeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pointScale:{value:500},time:{value:0}},
      vertexShader:'attribute vec3 aTint;attribute float aSize;attribute float aAlpha;uniform float pointScale;varying vec3 tint;varying float alpha;void main(){tint=aTint;alpha=aAlpha;vec4 view=modelViewMatrix*vec4(position,1.);gl_PointSize=min(90.,aSize*pointScale/max(.1,-view.z));gl_Position=projectionMatrix*view;}',
      fragmentShader:'uniform float time;varying vec3 tint;varying float alpha;void main(){vec2 p=gl_PointCoord*2.-1.;float r=length(p);float wisps=.83+.17*sin(p.x*12.+time)*sin(p.y*15.-time);float a=(1.-smoothstep(.1,1.,r))*alpha*wisps;if(a<.005)discard;gl_FragColor=vec4(tint,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',
    });this.smokeCloud=new T.Points(geometry,smokeMaterial);this.smokeCloud.frustumCulled=false;this.root.add(this.smokeCloud);
    for(let i=0;i<count;i++)this.smoke.push({...empty(),color:new T.Color(0x8f978e)});
    const shellCount=capacity<240?14:28;this.shellPool=new T.InstancedMesh(new T.CylinderGeometry(.012,.012,.055,6),new T.MeshStandardMaterial({color:0xb39959,metalness:.78,roughness:.34}),shellCount);this.shellPool.frustumCulled=false;this.shellPool.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(this.shellPool);
    for(let i=0;i<shellCount;i++){this.shells.push({...empty(),rotation:0,spin:0});this.shellPool.setMatrixAt(i,this.dummy.matrix);}
    const markMat=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float r=length(p);float chips=.85+.15*sin(atan(p.y,p.x)*9.);float a=1.-smoothstep(.35,.95,r/chips);gl_FragColor=vec4(mix(vec3(.035,.04,.033),vec3(.17,.15,.11),smoothstep(.1,.65,r)),a*.82);\n#include <colorspace_fragment>}',
    });const markGeometry=new T.PlaneGeometry(.2,.2);
    for(let i=0;i<(capacity<240?20:48);i++){const mesh=new T.Mesh(markGeometry,markMat);mesh.visible=false;this.root.add(mesh);this.marks.push({mesh,life:0});}
    for(let i=0;i<(capacity<240?4:8);i++){const root=createMuzzleFlash();this.root.add(root);this.muzzles.push({root,life:0});}
    const waveGeometry=new T.RingGeometry(.78,1,40);for(let i=0;i<4;i++){const mesh=new T.Mesh(waveGeometry,new T.MeshBasicMaterial({color:0xddd3b2,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.visible=false;this.root.add(mesh);this.waves.push({mesh,age:1});}
    this.flash=new T.PointLight(0xffb753,0,9,2);this.root.add(this.flash);scene.add(this.root);
  }
  setQuality(quality:Quality){this.quality=quality;}
  setResolution(height:number){this.smokeCloud.material.uniforms.pointScale.value=height*.72;}
  emit(pos:Vec3,count:number,color:number,force:number,gravity=9,size=.03,life=.5){
    count=Math.ceil(count*(this.quality==='performance'?.55:1));this.color.setHex(color);
    for(let i=0;i<count;i++){const id=this.cursor++%this.particles.length,p=this.particles[id];const max=life*(.5+Math.random()*.7);Object.assign(p,{life:max,max,x:pos.x,y:pos.y,z:pos.z,vx:(Math.random()-.5)*force,vy:Math.random()*force*.65,vz:(Math.random()-.5)*force,size:size*(.5+Math.random()),gravity});this.pool.setColorAt(id,this.color);}
    if(this.pool.instanceColor)this.pool.instanceColor.needsUpdate=true;
  }
  puff(pos:Vec3,count=3,size=.32,life=.75,color=0x9da89e){
    count=this.quality==='performance'?Math.min(2,count):count;
    for(let i=0;i<count;i++){const p=this.smoke[this.smokeCursor++%this.smoke.length],max=life*(.7+Math.random()*.6);Object.assign(p,{life:max,max,x:pos.x,y:pos.y,z:pos.z,vx:(Math.random()-.5)*.65,vy:.25+Math.random()*.4,vz:(Math.random()-.5)*.65,size:size*(.6+Math.random()),gravity:-.15});p.color.setHex(color);}
  }
  impact(pos:Vec3,body=false,normal?:Vec3,metal=false){
    this.emit(pos,body?5:metal?13:8,body?0x9a8875:metal?0xffd694:0xb3aa8e,body?1.2:metal?4.8:2.7,9,body?.022:.025,.4);
    if(!body){this.puff(pos,metal?2:5,metal?.19:.4,.8,metal?0xb1b6a6:0x9b9b8d);if(normal){const mark=this.marks[this.markCursor++%this.marks.length];mark.life=14;mark.mesh.position.set(pos.x+normal.x*.012,pos.y+normal.y*.012,pos.z+normal.z*.012);mark.mesh.quaternion.setFromUnitVectors(forward,this.direction.set(normal.x,normal.y,normal.z));mark.mesh.scale.setScalar(.6+Math.random()*.6);mark.mesh.visible=true;}}
  }
  eject(pos:Vec3,side:Vec3){const shell=this.shells[this.shellCursor++%this.shells.length];Object.assign(shell,{life:1.65,max:1.65,x:pos.x,y:pos.y,z:pos.z,vx:side.x*(1.5+Math.random()),vy:1.1+Math.random()*.7,vz:side.z*(1.5+Math.random()),size:1,gravity:9,rotation:Math.random()*5,spin:8+Math.random()*8});}
  explosion(pos:Vec3){this.emit(pos,75,0xffb251,15,10,.075,.8);this.emit(pos,25,0x6a6555,8,9,.045,1.1);this.puff(pos,18,1.6,2.2,0x666d63);const wave=this.waves[this.waveCursor++%this.waves.length];wave.age=0;wave.mesh.position.set(pos.x,Math.max(.065,pos.y-.25),pos.z);wave.mesh.material.color.setHex(0xe0b778);wave.mesh.scale.setScalar(.2);wave.mesh.material.opacity=.34;wave.mesh.visible=true;this.flash.position.set(pos.x,pos.y+.4,pos.z);this.flash.intensity=22;}
  elimination(pos:Vec3){const wave=this.waves[this.waveCursor++%this.waves.length];wave.age=0;wave.mesh.position.set(pos.x,pos.y+.03,pos.z);wave.mesh.scale.setScalar(.2);wave.mesh.material.color.setHex(0x9de2d1);wave.mesh.material.opacity=.34;wave.mesh.visible=true;this.emit(pos,12,0xa4d6cc,2,3,.028,.45);}
  shot(from:Vec3,to:Vec3,player=false,weapon='ar',style?:string){
    const tracer=this.tracers[this.tracerCursor++%this.tracers.length];tracer.from={...from};tracer.to={...to};tracer.age=0;tracer.fresh=true;tracer.mesh.visible=true;(tracer.mesh.material as T.MeshBasicMaterial).color.setHex(effectColor(style));this.placeTracer(tracer,from,to);tracer.width=weapon==='dmr'?1.2:weapon==='pistol'?.7:weapon==='shotgun'?.65:1;tracer.mesh.scale.x=tracer.mesh.scale.z=tracer.width;
    if(!player){const flash=this.muzzles[this.muzzleCursor++%this.muzzles.length];flash.root.position.set(from.x,from.y,from.z);flash.root.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),this.direction.set(to.x-from.x,to.y-from.y,to.z-from.z).normalize());flash.root.scale.setScalar(.7+Math.random()*.5);flash.root.visible=true;setMuzzleColor(flash.root,effectColor(style));flash.life=.055;}
    this.puff(from,player?(weapon==='dmr'?4:weapon==='pistol'?1:2):1,weapon==='dmr'?.24:.16,.4);if(player){this.flash.position.set(from.x,from.y,from.z);this.flash.intensity=3;}
  }
  update(...args:Parameters<typeof effect_update.update>):ReturnType<typeof effect_update.update>{return effect_update.update.apply(this,args);}
  placeTracer(...args:Parameters<typeof effect_update.placeTracer>):ReturnType<typeof effect_update.placeTracer>{return effect_update.placeTracer.apply(this,args);}
  integrate(...args:Parameters<typeof effect_update.integrate>):ReturnType<typeof effect_update.integrate>{return effect_update.integrate.apply(this,args);}
  clear(){for(const p of [...this.particles,...this.smoke,...this.shells])p.life=0;for(const t of this.tracers){t.mesh.visible=false;t.age=1;}for(const m of this.marks){m.life=0;m.mesh.visible=false;}for(const m of this.muzzles){m.life=0;m.root.visible=false;}for(const w of this.waves){w.age=1;w.mesh.visible=false;}this.flash.intensity=0;this.update(0);}
  /**
   * Libère les géométries et les matériaux du pool.
   *
   * Les particules, traçantes et impacts partagent des géométries : les
   * libérer une par une serait à la fois lent et faux. On parcourt donc la
   * racine une seule fois, et on laisse les doublons au `dispose` idempotent
   * de Three.js.
   */
  dispose(){this.root.traverse((object)=>{const mesh=object as T.Mesh;mesh.geometry?.dispose?.();const material=mesh.material as T.Material|T.Material[]|undefined;if(Array.isArray(material))for(const entry of material)entry.dispose();else material?.dispose?.();});this.root.removeFromParent();this.particles=[];this.smoke=[];this.shells=[];this.tracers=[];this.marks=[];this.muzzles=[];this.waves=[];}
}
