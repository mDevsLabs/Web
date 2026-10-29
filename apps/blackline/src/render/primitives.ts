import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const geometries=new Map<string,T.BufferGeometry>();
export const materials=new Map<string,T.MeshStandardMaterial>();
export function material(color:number,metal=.1,rough=.75){metal=Math.round(metal*2)/2;rough=Math.round(rough*4)/4;const key=`${color}-${metal}-${rough}`;let m=materials.get(key);if(!m){m=new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});materials.set(key,m);}return m;}
export function sharedBox(){let g=geometries.get('box');if(!g){g=new T.BoxGeometry(1,1,1);geometries.set('box',g);}return g;}
export function meshBox(w:number,h:number,d:number,x:number,y:number,z:number,color:number,group:T.Group,metal=.1,rough=.7){const m=new T.Mesh(sharedBox(),material(color,metal,rough));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
export function meshBeveledBox(w:number,h:number,d:number,x:number,y:number,z:number,color:number,group:T.Group,metal=.1,rough=.7){let geometry=geometries.get('beveled-box');if(!geometry){geometry=new RoundedBoxGeometry(1,1,1,1,.065);geometries.set('beveled-box',geometry);}const mesh=meshBox(w,h,d,x,y,z,color,group,metal,rough);mesh.geometry=geometry;return mesh;}
export function meshCylinder(r1:number,r2:number,h:number,color:number,group:T.Group,x=0,y=0,z=0,segments=12,openEnded=false){const key=`cyl-${r1}-${r2}-${h}-${segments}-${openEnded}`;let geom=geometries.get(key);if(!geom){geom=new T.CylinderGeometry(r1,r2,h,segments,1,openEnded);geometries.set(key,geom);}const m=new T.Mesh(geom,material(color,.2,.65));m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;}
export function optimizeModel(group:T.Group){
  const entries=new Map<T.Material,T.BufferGeometry[]>();
  for(const o of [...group.children]){if(o instanceof T.Group){optimizeModel(o);continue;}if(!(o instanceof T.Mesh)||Array.isArray(o.material))continue;
    o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix),list=entries.get(o.material)??[];list.push(g);entries.set(o.material,list);group.remove(o);
  }
  for(const [mat,list]of entries){// Extruded bevels are non-indexed; boxes and tubes are indexed. Normalize mixed batches before merging.
    const mixed=list.some(g=>g.index)&&list.some(g=>!g.index);
    if(mixed)for(let i=0;i<list.length;i++)if(list[i].index){const original=list[i];list[i]=original.toNonIndexed();original.dispose();}
    const g=mergeGeometries(list,false);for(const original of list)original.dispose();if(!g)throw new Error('Weapon geometry batch is incompatible');g.userData.dynamicMerged=true;const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;group.add(m);}
}
export function disposeModel(root:T.Group){root.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.userData.dynamicMerged)o.geometry.dispose();});}
export class Batch {
  entries=new Map<T.Material,T.BufferGeometry[]>();
  box(w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material,ry=0,rz=0,tile=false){const g=sharedBox().clone(),m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(0,ry,rz)),new T.Vector3(w,h,d));if(tile){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(face<2?d:w)/3,uv.getY(i)*(face>=2&&face<4?d:h)/3);}}g.applyMatrix4(m);this.add(g,mat);}
  cylinder(r:number,h:number,x:number,y:number,z:number,mat:T.Material,rz=0){const g=new T.CylinderGeometry(r,r,h,10);g.rotateZ(rz);g.translate(x,y,z);this.add(g,mat);}
  add(g:T.BufferGeometry,mat:T.Material){const list=this.entries.get(mat)??[];list.push(g);this.entries.set(mat,list);}
  finish(root:T.Group){for(const [m,list]of this.entries){const geometry=mergeGeometries(list,false);if(geometry){const mesh=new T.Mesh(geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}for(const g of list)g.dispose();}this.entries.clear();}
}
