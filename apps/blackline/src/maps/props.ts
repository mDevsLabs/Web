import type {Prop} from '../types.ts';
export const prop=(kind:Prop['kind'],x:number,z:number,w:number,d:number,h:number,color?:number,label?:string):Prop=>({kind,x,z,w,d,h,color,label});
