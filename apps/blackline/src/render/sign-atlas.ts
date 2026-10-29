import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export class SignAtlas {
  canvas:HTMLCanvasElement;texture:T.CanvasTexture;material:T.MeshStandardMaterial;count=0;meshes:T.Mesh[]=[];
  constructor(readonly mobile:boolean){const c=this.canvas=document.createElement('canvas');c.width=mobile?1024:2048;c.height=c.width;this.texture=new T.CanvasTexture(c);this.texture.colorSpace=T.SRGBColorSpace;this.material=new T.MeshStandardMaterial({map:this.texture,roughness:.85});}
  sign(text:string,w:number,h:number,x:number,y:number,z:number,ry:number,color:number,bg:number){if(this.count>=64)throw new Error('Sign atlas capacity exceeded');const index=this.count++,cellW=this.canvas.width/4,cellH=this.canvas.height/16,cx=index%4*cellW,cy=Math.floor(index/4)*cellH,ctx=this.canvas.getContext('2d')!;
    ctx.fillStyle=`#${bg.toString(16).padStart(6,'0')}`;ctx.fillRect(cx,cy,cellW,cellH);ctx.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;ctx.lineWidth=cellW/256;ctx.strokeRect(cx+cellW*.014,cy+cellH*.055,cellW*.972,cellH*.89);ctx.fillStyle=ctx.strokeStyle;ctx.font=`bold ${Math.round(cellH*.38)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,cx+cellW/2,cy+cellH*.52,cellW*.91);this.texture.needsUpdate=true;
    const geometry=new T.PlaneGeometry(w,h),uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(cx+1+uv.getX(i)*(cellW-2))/this.canvas.width,1-(cy+1+(1-uv.getY(i))*(cellH-2))/this.canvas.height);
    const mesh=new T.Mesh(geometry,this.material);mesh.position.set(x,y,z);mesh.rotation.y=ry;this.meshes.push(mesh);return mesh;
  }
  batch(root:T.Group){const geometries:T.BufferGeometry[]=[];for(const mesh of this.meshes){if(mesh.parent!==root)continue;mesh.updateMatrix();geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));root.remove(mesh);mesh.geometry.dispose();}if(geometries.length){const geometry=mergeGeometries(geometries,false);if(geometry)root.add(new T.Mesh(geometry,this.material));for(const g of geometries)g.dispose();}this.meshes=[];}
}
