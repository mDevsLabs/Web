import * as T from 'three';
import { reloadPose } from './combat-motion.ts';

const flashGeometry=new T.PlaneGeometry(1,1);
const flashMaterial=new T.ShaderMaterial({uniforms:{tint:{value:new T.Color(0xffb251)}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 tint;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float star=pow(abs(cos(a*3.)),8.);float flame=(1.-smoothstep(.12,.9,r))*(.28+.72*star);float core=1.-smoothstep(0.,.3,r);gl_FragColor=vec4(mix(tint,vec3(1.,.94,.8),core),flame*.9);}',
});
const flashPalettes=new Map<number,T.ShaderMaterial>();
function flashPalette(color:number){let material=flashPalettes.get(color);if(!material){material=flashMaterial.clone();material.uniforms.tint.value=new T.Color(color);flashPalettes.set(color,material);}return material;}
export function setMuzzleColor(root:T.Group,color:number){root.getObjectByName('muzzle-flash')?.traverse(o=>{if(o instanceof T.Mesh)o.material=flashPalette(color);});}
export function createMuzzleFlash(){
  const group=new T.Group();group.name='muzzle-flash';
  for(let i=0;i<3;i++){const plane=new T.Mesh(flashGeometry,flashMaterial);plane.rotation.set(0,i===1?Math.PI/2:0,i===2?Math.PI/4:0);plane.scale.set(i===1?.48:.28,.28,1);group.add(plane);}
  group.visible=false;return group;
}
type MotionParts={magazine?:T.Object3D;hand?:T.Object3D;bolt?:T.Object3D;flash?:T.Object3D};
const motionCache=new WeakMap<T.Group,MotionParts>();
export function animateWeaponParts(root:T.Group,progress:number,shot:number){
  const pose=reloadPose(progress);
  let parts=motionCache.get(root);if(!parts){parts={magazine:root.getObjectByName('magazine'),hand:root.getObjectByName('support-hand'),bolt:root.getObjectByName('charging-handle'),flash:root.getObjectByName('muzzle-flash')};motionCache.set(root,parts);}
  const move=(part:T.Object3D|undefined,x:number,y:number,z:number)=>{if(!part)return;const rest:T.Vector3=part.userData.restPosition??=part.position.clone();part.position.set(rest.x+x,rest.y+y,rest.z+z);};
  move(parts.magazine,0,pose.magazineY,pose.magazineZ);move(parts.hand,pose.handX,pose.handY,pose.handZ);move(parts.bolt,0,0,pose.boltZ+shot*.05);
  if(parts.magazine){parts.magazine.visible=pose.magazineVisible;parts.magazine.rotation.x=-.13+pose.magazineAngle;}
  const flash:T.Object3D|undefined=parts.flash;if(flash){flash.visible=shot>.08;flash.scale.setScalar(.65+shot*.55);flash.rotation.z=shot*4;}
  return pose;
}
