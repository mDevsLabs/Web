import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// Soft light needs far less resolution than geometry. Keep the source render at UHD,
// but bound the five HDR blur mips instead of allocating them all at 8K.
export class UltraBloomPass extends UnrealBloomPass {
  override setSize(width:number,height:number){const scale=Math.min(1,1920/width,1080/height);super.setSize(Math.max(2,Math.round(width*scale)),Math.max(2,Math.round(height*scale)));}
}
