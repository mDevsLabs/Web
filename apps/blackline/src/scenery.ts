import * as T from 'three';
import { seeded } from './math.ts';
import { finishMaterial } from './surfaces.ts';
import type { MapData } from './types.ts';
import type { Batch } from './world.ts';

export const skyVertex='varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
export const skyFragment=`
varying vec3 vPos;uniform vec3 top;uniform vec3 bottom;uniform vec3 sun;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){vec3 p=normalize(vPos);float h=clamp(p.y*1.5,0.,1.);vec3 c=mix(bottom,top,pow(h,.6));
vec2 uv=p.xz/max(.15,p.y)*1.8+vec2(time*.003,0.);float n=noise(uv)*.57+noise(uv*2.03)*.28+noise(uv*4.07)*.15;
float cloud=smoothstep(.49,.73,n)*smoothstep(.03,.23,p.y);float rim=smoothstep(.49,.6,n)*(1.-smoothstep(.6,.72,n));vec3 cloudColor=mix(bottom,vec3(.94,.96,.98),.55)+vec3(.12,.08,.035)*rim;c=mix(c,cloudColor,cloud*.76);
float s=pow(max(dot(p,normalize(sun)),0.),350.);float glow=pow(max(dot(p,normalize(sun)),0.),12.);c+=vec3(1.,.69,.36)*s*2.+vec3(.15,.09,.035)*glow;
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export const waterVertex=`
uniform float time;varying vec3 p;varying vec3 worldPos;varying vec3 worldNormal;
void main(){vec3 pos=position;float a=pos.x*.2+time*.45,b=pos.y*.12-time*.3;
pos.z+=sin(a)*.17+sin(b)*.2;p=pos;worldPos=(modelMatrix*vec4(pos,1.)).xyz;
worldNormal=normalize(mat3(modelMatrix)*vec3(-cos(a)*.034,-cos(b)*.024,1.));gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}`;
export const waterFragment=`
uniform float time;varying vec3 p;varying vec3 worldPos;varying vec3 worldNormal;
void main(){vec3 normal=normalize(worldNormal+vec3(sin(p.x*.8+time)*.015,0.,cos(p.y*.7-time)*.02));
vec3 eye=normalize(cameraPosition-worldPos);float fresnel=pow(1.-max(0.,dot(normal,eye)),3.);
float wave=sin(p.x*.6+p.y*.25+time*.4)*sin(p.y*.4-time*.7);vec3 c=mix(vec3(.05,.15,.18),vec3(.2,.35,.37),wave*.17+.4);
vec3 skyReflection=mix(vec3(.57,.64,.65),vec3(.22,.36,.49),smoothstep(0.,.8,reflect(-eye,normal).y));c=mix(c,skyReflection,fresnel*.82);vec3 reflected=reflect(-eye,normal);float sparkle=pow(max(dot(reflected,normalize(vec3(-45.,58.,-55.))),0.),110.);
c+=vec3(1.,.72,.4)*sparkle*.65;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

function contactTexture(){
  const bytes=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,edge=Math.max(Math.abs(x-31.5),Math.abs(y-31.5))/32;bytes[i+3]=Math.round((1-T.MathUtils.smoothstep(edge,.55,1))*140);}
  const t=new T.DataTexture(bytes,64,64);t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;
}
export function buildScenery(map:MapData,base:Batch,detail:Batch,root:T.Group){
  const harbor=map.id==='harbor',random=seeded(harbor?5091:9321),owned:T.Material[]=[],textures:T.Texture[]=[],flags:T.Mesh[]=[];
  const steel=finishMaterial(new T.MeshStandardMaterial({color:0x5e6a63,metalness:.6,roughness:.6}),'metal');
  const timber=finishMaterial(new T.MeshStandardMaterial({color:0x807152,roughness:.94}),'fabric');
  const rubber=new T.MeshStandardMaterial({color:0x242c29,roughness:.93}),bag=finishMaterial(new T.MeshStandardMaterial({color:harbor?0x697257:0xa99876,roughness:1}),'fabric');
  owned.push(steel,timber,rubber,bag);
  const shadowMap=contactTexture(),shadowMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,opacity:.52,polygonOffset:true,polygonOffsetFactor:-1});textures.push(shadowMap);owned.push(shadowMat);
  for(const p of map.props){
    if(p.y!==undefined)continue;
    const shadow=new T.PlaneGeometry(p.w+1.8,p.d+1.8);shadow.rotateX(-Math.PI/2);shadow.translate(p.x+.2,.051,p.z+.2);base.add(shadow,shadowMat);
    if(p.kind==='building'){for(let i=0;i<4;i++)detail.box(.07,.08,p.d*.58,p.x+p.w*.23+i*.18,p.h+.96,p.z,steel);detail.cylinder(.055,1.8,p.x+p.w*.26,p.h+1.8,p.z-p.d*.22,steel);for(const side of [-1,1])detail.box(.7,.035,.035,p.x+p.w*.26+side*.15,p.h+2.1,p.z-p.d*.22,steel);}
    if(p.kind==='container'){
      for(const side of [-1,1]){
        for(const q of [-.22,.22])detail.box(.05,p.h*.8,.06,p.x+side*(p.w/2+.07),p.h*.5,p.z+q*p.d,steel);
        for(const y of [.32,p.h-.32])for(const z of [-.22,.22])detail.box(.13,.11,.14,p.x+side*(p.w/2+.1),y,p.z+z*p.d,steel);
        detail.box(.1,.07,.55,p.x+side*(p.w/2+.14),p.h*.44,p.z,steel);
      }
      for(let i=0;i<5;i++)detail.box(p.w*.75,.009,.022,p.x+(random()-.5)*p.w*.12,p.h+.012,p.z-p.d*.3+i*p.d*.15,rubber);
    }else if(p.kind==='crate'){
      for(let i=0;i<6;i++)detail.box(p.w*.96,.045,p.d*.075,p.x,p.h+.022,p.z-p.d*.42+i*p.d*.168,timber);
      for(const side of [-1,1])detail.box(p.w*.1,p.h*.9,.025,p.x+side*p.w*.32,p.h*.5,p.z+p.d/2+.025,steel);
    }else if(p.kind==='barrier'&&!harbor){
      for(let i=0;i<Math.floor(Math.max(p.w,p.d)/.65);i++){
        const wide=p.w>p.d,x=p.x+(wide?(i+.5)*.65-p.w/2:0),z=p.z+(wide?0:(i+.5)*.65-p.d/2),geo=new T.SphereGeometry(1,8,5);
        geo.scale(wide?.37:.29,.18,wide?.29:.37);geo.translate(x,p.h+.08,z);detail.add(geo,bag);
      }
    }else if(p.kind==='truck'){
      const wide=p.w>p.d;for(const side of [-1,1])detail.box(wide?.16:.38,.3,wide?.38:.16,p.x+side*p.w*.44,1.9,p.z+side*p.d*.44,steel);
    }
  }
  // Cosmetic plants stay outside movement bounds and do not introduce invisible collisions.
  const plantMats=[0x66774e,0x7c8057,0x4b6250].map(color=>new T.MeshStandardMaterial({color:harbor?color:0x8a815b,roughness:1,side:T.DoubleSide}));owned.push(...plantMats);
  for(let i=0;i<430;i++){
    const side=i%2?-1:1,x=side*(map.width/2+1.4+random()*3),z=(random()-.5)*(map.depth+6),height=.2+random()*.65;
    for(const angle of [random()*Math.PI,random()*Math.PI]){const blade=new T.PlaneGeometry(.12,height,1,1);blade.rotateY(angle);blade.rotateZ((random()-.5)*.3);blade.translate(x,height/2,z);detail.add(blade,plantMats[i%3]);}
  }
  // Cable trays, grates and roof hardware are merged by material.
  for(const p of map.props.filter(p=>p.kind==='building')){
    detail.box(p.w*.75,.06,.35,p.x,p.h+.2,p.z-p.d*.2,steel);
    for(let i=0;i<12;i++)detail.box(.065,.035,.4,p.x-p.w*.33+i*p.w*.06,p.h+.25,p.z-p.d*.2,steel);
    const mast=new T.Group();mast.position.set(p.x+p.w*.25,p.h,p.z);root.add(mast);
    const pole=new T.Mesh(new T.CylinderGeometry(.025,.025,2.5,6),steel);pole.position.y=1.25;mast.add(pole);
    const flagMat=new T.MeshStandardMaterial({color:harbor?0x789f98:0xb4a683,roughness:1,side:T.DoubleSide});owned.push(flagMat);
    const flag=new T.Mesh(new T.PlaneGeometry(.9,.45,8,3),flagMat);flag.position.set(.47,2.05,0);mast.add(flag);flags.push(flag);
  }
  for(const side of [-1,1])for(let z=-28;z<=28;z+=14){
    const x=side*(map.width/2-.8);base.box(.08,.05,1.1,x,.07,z,steel);for(let j=0;j<9;j++)base.box(.55,.02,.032,x,.099,z-.48+j*.12,steel);
  }
  return {owned,textures,flags};
}
