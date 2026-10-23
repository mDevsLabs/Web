import * as T from 'three';
import {arenaDressing} from './render/arena-dressing.ts';
import {ARENAS} from './maps/catalog.ts';
import { seeded } from './math.ts';
import { environmentMaps } from './render/environment-surfaces.ts';
import { skyMaterial,SUN_POSITION } from './render/lighting.ts';
import { environmentDetails } from './render/environment-detail.ts';
import { Batch,geometries,material,sharedBox } from './render/primitives.ts';
import { SignAtlas } from './render/sign-atlas.ts';
import { noiseTexture } from './render/textures.ts';
import { buildScenery } from './scenery.ts';
import type { MapData } from './types.ts';
import * as ambience from './world/ambience.ts';
import * as objectives from './world/objectives.ts';
import * as props from './world/props.ts';
export { Batch,disposeModel } from './render/primitives.ts';
export { createSoldier } from './render/soldiers.ts';
export type { SoldierVisual } from './render/soldiers.ts';
export { createWeapon } from './render/weapons.ts';

export class World {
  root=new T.Group();collision:T.Object3D[]=[];objectives:{root:T.Group;ring:T.Mesh;flag:T.Mesh;beam:T.Mesh}[]=[];
  details=new T.Group();facadeTexture:T.Texture|null=null;relief:T.Texture|null=null;
  textures:T.Texture[]=[];water:T.ShaderMaterial|null=null;dust:T.Points|null=null;time=0;
  sky:T.ShaderMaterial|null=null;sceneryFlags:T.Mesh[]=[];
  signAtlas:SignAtlas|null=null;owned:T.Material[]=[];
  constructor(readonly scene:T.Scene,readonly map:MapData,readonly mobile=false){this.build();scene.add(this.root);}
  build(){
    const harbor=this.map.id==='harbor',theme=ARENAS[this.map.id],rand=seeded(harbor?450:873),b=new Batch(),detail=new Batch();
    this.scene.fog=new T.FogExp2(theme.fog,this.map.id==='forest'?.010:harbor?.0078:.0068);
    this.scene.background=new T.Color(theme.fog);
    const concrete=noiseTexture('concrete',13),metal=noiseTexture('metal',71),sand=noiseTexture('sand',24);this.textures.push(concrete,metal,sand);this.facadeTexture=concrete.clone();this.facadeTexture.repeat.set(1,1);this.textures.push(this.facadeTexture);concrete.repeat.set(18,16);sand.repeat.set(22,20);
    const height=new Uint8Array(256*256*4),grain=seeded(319);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,value=x%64<2||y%128<2?80:168+Math.round(grain()*35);height[i]=height[i+1]=height[i+2]=value;height[i+3]=255;}this.relief=new T.DataTexture(height,256,256);this.relief.wrapS=this.relief.wrapT=T.RepeatWrapping;this.relief.generateMipmaps=true;this.relief.magFilter=T.LinearFilter;this.relief.minFilter=T.LinearMipmapLinearFilter;this.relief.anisotropy=8;this.relief.needsUpdate=true;this.textures.push(this.relief);
    const groundRelief=this.relief.clone();groundRelief.repeat.set(80,70);this.textures.push(groundRelief);
    const groundMaps=environmentMaps(harbor?'asphalt':'sand'),groundNormal=groundMaps.normal.clone(),groundRough=groundMaps.roughness.clone();groundNormal.repeat.set(40,34);groundRough.repeat.copy(groundNormal.repeat);this.textures.push(groundNormal,groundRough);
    const groundMat=new T.MeshStandardMaterial({map:harbor?concrete:sand,color:theme.ground,normalMap:groundNormal,normalScale:new T.Vector2(.4,.4),roughnessMap:groundRough,roughness:harbor?.82:1,metalness:harbor?.12:0});this.owned.push(groundMat);
    const ground=new T.Mesh(new T.PlaneGeometry(220,180),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.root.add(ground);
    const skyMat=skyMaterial(harbor);skyMat.uniforms.top.value.setHex(theme.top);skyMat.uniforms.bottom.value.setHex(theme.horizon);this.sky=skyMat;this.owned.push(skyMat);const sky=new T.Mesh(new T.SphereGeometry(450,28,16),skyMat);sky.position.y=-5;this.root.add(sky);
    const hemi=new T.HemisphereLight(harbor?0xbfd9df:0xc6d7dd,harbor?0x434d41:0x726047,1.55);this.root.add(hemi);
    const sun=new T.DirectionalLight(theme.sun,this.map.id==='forest'?2.5:harbor?3.2:4.2);sun.position.copy(SUN_POSITION);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-this.map.width*.6,right:this.map.width*.6,top:this.map.depth*.65,bottom:-this.map.depth*.65,near:1,far:220});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;this.root.add(sun);
    const road=material(harbor?0x303b3e:0x675f51,.1,.87),paint=material(0xbbad75,.05,.85),dark=material(0x29332f,.2,.9),concreteMat=material(harbor?0x7a827d:0xa1957f,.05,.95);
    const asphalt=environmentMaps('asphalt');road.map=asphalt.color;road.normalMap=asphalt.normal;road.normalScale.setScalar(.35);road.roughnessMap=asphalt.roughness;
    b.box(this.map.width-2,.017,12,0,.014,0,road,0,0,true);b.box(11,.017,this.map.depth-2,0,.015,0,road,0,0,true);
    for(let x=-this.map.width/2+4;x<this.map.width/2;x+=7){b.box(3,.018,.13,x,.038,-5,paint);b.box(3,.018,.13,x,.038,5,paint);}for(let z=-this.map.depth/2+5;z<this.map.depth/2-1;z+=7){b.box(.13,.019,3,-4.5,.04,z,paint);b.box(.13,.019,3,4.5,.04,z,paint);}
    for(let i=0;i<8;i++){b.box(4,.02,.45,-.2,.04,27+i*.8,paint);b.box(4,.02,.45,.2,.04,-27-i*.8,paint);}
    for(const p of this.map.props)this.prop(p,b,metal,concreteMat,detail,paint);
    // Perimeter uses the same bounds as movement and navigation.
    for(const side of [-1,1]){
      b.box(this.map.width+2,.45,.55,0,.225,side*(this.map.depth/2+.8),concreteMat);b.box(.55,.45,this.map.depth+2,side*(this.map.width/2+.8),.225,0,concreteMat);
      for(let x=-this.map.width/2;x<=this.map.width/2;x+=5.5){b.cylinder(.047,3.5,x,1.75,side*(this.map.depth/2+.8),dark);for(let y=.6;y<=3.3;y+=.65)b.box(5.5,.018,.018,x+2.75,y,side*(this.map.depth/2+.8),dark);}
      for(let z=-this.map.depth/2;z<=this.map.depth/2;z+=6){b.cylinder(.045,3.5,side*(this.map.width/2+.8),1.75,z,dark);for(let y=.6;y<=3.3;y+=.65)b.box(.02,.018,6,side*(this.map.width/2+.8),y,z+3,dark);}
    }
    // Fine steel fence diagonals are batched instead of individual draw calls.
    for(const side of [-1,1])for(let x=-this.map.width/2;x<this.map.width/2;x+=1.1){b.box(.012,3.4,.012,x,1.7,side*(this.map.depth/2+.85),dark,0,.2);b.box(.012,3.4,.012,x+.5,1.7,side*(this.map.depth/2+.85),dark,0,-.2);}
    for(const [x,z]of [[-27,4],[27,-4],[-10,-16],[10,16]] as const){b.cylinder(.095,7,x,3.5,z,dark);b.box(1.3,.1,.16,x+.45,6.85,z,dark);const lampMat=new T.MeshStandardMaterial({color:0xffdcad,emissive:0xffc785,emissiveIntensity:3});this.owned.push(lampMat);b.box(.7,.065,.22,x+.8,6.78,z,lampMat);const lamp=new T.PointLight(0xffd5a0,6,14,2);lamp.position.set(x+.8,6.65,z);this.root.add(lamp);}
    for(let i=0;i<55;i++){const x=(rand()-.5)*83,z=(rand()-.5)*67;const r=rand()*.5+.08;b.box(r,.014,r*.7,x,.033,z,material(i%2?0x726f60:0x414943));}
    for(let x=-40;x<40;x+=10){b.box(1.8,.09,.65,x,.07,34,concreteMat);for(let j=0;j<8;j++)b.box(.1,.017,.5,x-.7+j*.2,.124,34,dark);}
    if(harbor){
      this.ocean();for(const [x,z]of [[-74,-29],[73,38],[-44,68]] as const)this.crane(x,z,b);
      for(let i=0;i<6;i++){const x=-80+i*29,z=-82-rand()*20,h=18+rand()*22;b.box(15,h,11,x,h/2,z,material(0x626d71));for(let j=0;j<5;j++)b.box(.6,h*.65,.7,x-5+j*2.4,h*.53,z-5.6,material(0x8d9996));}
      const puddleMat=new T.MeshPhysicalMaterial({color:0x687d7d,metalness:0,roughness:.08,clearcoat:1,clearcoatRoughness:.06,ior:1.33,transparent:true,opacity:.58});this.owned.push(puddleMat);
      for(let i=0;i<17;i++){const m=new T.Mesh(new T.CircleGeometry(1,22),puddleMat);m.rotation.x=-Math.PI/2;m.scale.set(rand()*4+1,rand()*1.8+.6,1);m.position.set((rand()-.5)*78,.024,(rand()-.5)*62);this.root.add(m);}
      // Containers outside the playable boundary create a harbor skyline.
      for(let i=0;i<12;i++){const h=3.4+Math.floor(rand()*3)*3.4;const x=74+rand()*15,z=-34+i*6;b.box(12,h,4,x,h/2,z,material([0x455c61,0x5d6250,0x855642][i%3],.4,.7));for(let q=0;q<14;q++)b.box(.05,h,.11,x-5.5+q*.8,h/2,z+2,material(0x314747));}
    }else if(this.map.id==='outpost'){
      for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=90+rand()*30,h=20+rand()*43;const geo=new T.ConeGeometry(20+rand()*18,h,5);geo.rotateY(rand()*5);geo.translate(Math.cos(a)*r,h/2-3,Math.sin(a)*r);b.add(geo,material([0x817766,0x8c816a,0x736e60][i%3],0,1));}
      this.radar(-74,-29,b);this.radar(74,30,b);
      const helipad=new T.Mesh(new T.RingGeometry(5.8,6.1,48),paint);helipad.rotation.x=-Math.PI/2;helipad.position.set(-18,.045,-27);this.root.add(helipad);b.box(.3,.018,4,-19,.05,-27,paint);b.box(.3,.018,4,-17,.05,-27,paint);b.box(2,.018,.3,-18,.05,-27,paint);
    }
    for(let i=0;i<8;i++){const x=-38+i*11,z=i%2?-34:34;b.cylinder(.23,1.1,x,.55,z,material(0x837944));b.box(.4,.14,.4,x,.85,z,paint);}
    arenaDressing(this.map,b,detail);
    environmentDetails(this.map,b,detail);
    const scenery=buildScenery(this.map,b,detail,this.root);this.owned.push(...scenery.owned);this.textures.push(...scenery.textures);this.sceneryFlags=scenery.flags;
    b.finish(this.root);detail.finish(this.details);this.details.name='architectural-details';this.root.add(this.details);
    for(const p of this.map.props){if(p.solid===false)continue;const proxy=new T.Mesh(sharedBox(),new T.MeshBasicMaterial({visible:false}));proxy.position.set(p.x,(p.y??0)+p.h/2,p.z);proxy.scale.set(p.w,p.h,p.d);this.collision.push(proxy);}
    this.atmosphere(rand,harbor);
    for(let i=0;i<3;i++)this.objective(this.map.objectives[i].x,this.map.objectives[i].z,String.fromCharCode(65+i));
    this.signAtlas?.batch(this.root);
    this.root.updateMatrixWorld(true);
  }
  prop(...args:Parameters<typeof props.prop>):ReturnType<typeof props.prop>{return props.prop.apply(this,args);}
  sign(...args:Parameters<typeof props.sign>):ReturnType<typeof props.sign>{return props.sign.apply(this,args);}

  crane(...args:Parameters<typeof ambience.crane>):ReturnType<typeof ambience.crane>{return ambience.crane.apply(this,args);}
  radar(...args:Parameters<typeof ambience.radar>):ReturnType<typeof ambience.radar>{return ambience.radar.apply(this,args);}
  ocean(...args:Parameters<typeof ambience.ocean>):ReturnType<typeof ambience.ocean>{return ambience.ocean.apply(this,args);}
  atmosphere(...args:Parameters<typeof ambience.atmosphere>):ReturnType<typeof ambience.atmosphere>{return ambience.atmosphere.apply(this,args);}
  objective(...args:Parameters<typeof objectives.objective>):ReturnType<typeof objectives.objective>{return objectives.objective.apply(this,args);}
  update(...args:Parameters<typeof objectives.update>):ReturnType<typeof objectives.update>{return objectives.update.apply(this,args);}
  setObjectivesVisible(...args:Parameters<typeof objectives.setObjectivesVisible>):ReturnType<typeof objectives.setObjectivesVisible>{return objectives.setObjectivesVisible.apply(this,args);}
  setQuality(...args:Parameters<typeof objectives.setQuality>):ReturnType<typeof objectives.setQuality>{return objectives.setQuality.apply(this,args);}
  setObjective(...args:Parameters<typeof objectives.setObjective>):ReturnType<typeof objectives.setObjective>{return objectives.setObjective.apply(this,args);}
  dispose(){this.scene.remove(this.root);this.root.traverse(o=>{if(o instanceof T.DirectionalLight)o.shadow.dispose();if(o instanceof T.Mesh||o instanceof T.Points){if(![...geometries.values()].includes(o.geometry))o.geometry.dispose();}});for(const t of this.textures)t.dispose();for(const m of this.owned)m.dispose();for(const p of this.collision)(p as T.Mesh).material instanceof T.Material&&((p as T.Mesh).material as T.Material).dispose();this.collision=[];}
}
