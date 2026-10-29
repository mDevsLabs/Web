import * as T from 'three';
import { skyFragment,skyVertex } from '../scenery.ts';
export const SUN_POSITION=new T.Vector3(-45,58,-55);
export function skyMaterial(harbor=true){return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(harbor?0x385d7a:0x647b8b)},bottom:{value:new T.Color(harbor?0xc5bdad:0xdecdb1)},sun:{value:SUN_POSITION.clone().normalize()},time:{value:0}},vertexShader:skyVertex,fragmentShader:skyFragment});}
export function outdoorEnvironment(renderer:T.WebGLRenderer){
  const scene=new T.Scene(),material=skyMaterial(),geometry=new T.SphereGeometry(100,24,12);scene.add(new T.Mesh(geometry,material));
  const pmrem=new T.PMREMGenerator(renderer);
  try{return pmrem.fromScene(scene,.025,.1,300);}finally{geometry.dispose();material.dispose();pmrem.dispose();}
}
