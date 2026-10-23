import * as T from 'three';
import { generateSurface,type Finish } from './render/surface-generator.ts';

const cache=new Map<Finish,{color:T.DataTexture;roughness:T.DataTexture;normal:T.DataTexture}>();
export function surfaceMaps(kind:Finish){
  const cached=cache.get(kind);if(cached)return cached;
  const {size,color:albedo,roughness,normal}=generateSurface(kind);
  const texture=(data:Uint8Array,color=false)=>{const t=new T.DataTexture(data,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=2;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;return t;};
  const result={color:texture(albedo,true),roughness:texture(roughness),normal:texture(normal)};cache.set(kind,result);return result;
}
export function finishMaterial(material:T.MeshStandardMaterial,kind:Finish){
  const maps=surfaceMaps(kind);material.map=maps.color;material.normalMap=maps.normal;material.normalScale.setScalar(kind==='metal'?.25:.4);material.roughnessMap=maps.roughness;return material;
}
