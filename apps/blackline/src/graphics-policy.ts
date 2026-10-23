import type { Settings } from './types.ts';
export type RenderResolution='auto'|'native'|'1080p'|'1440p'|'4k'|'8k';
export interface RenderLimits {maxTextureSize:number;maxRenderbufferSize:number;maxViewportWidth:number;maxViewportHeight:number;}
export const RESOLUTIONS:Record<Exclude<RenderResolution,'auto'|'native'>,[number,number]>={'1080p':[1920,1080],'1440p':[2560,1440],'4k':[3840,2160],'8k':[7680,4320]};
// A ceiling on each dimension preserves aspect ratio, including ultrawide and portrait.
// Explicit UHD modes supersample even on a smaller display; auto keeps the mobile budget.
export function renderDimensions(width:number,height:number,dpr:number,budget:{pixels:number;ratio:number},mode:RenderResolution='auto',limits?:RenderLimits,adaptiveScale=1){
  const w=Math.max(1,Math.round(width)||1),h=Math.max(1,Math.round(height)||1);
  let ratio=mode==='auto'?Math.min(budget.ratio,Math.sqrt(budget.pixels/(w*h))):mode==='native'?Math.max(1,Math.min(4,Number.isFinite(dpr)?dpr:1)):Math.min(RESOLUTIONS[mode][0]/w,RESOLUTIONS[mode][1]/h);
  const requestedWidth=Math.max(1,Math.floor(w*ratio)),requestedHeight=Math.max(1,Math.floor(h*ratio));
  const maxW=Math.max(1,Math.min(7680,limits?.maxTextureSize??7680,limits?.maxRenderbufferSize??7680,limits?.maxViewportWidth??7680));
  const maxH=Math.max(1,Math.min(7680,limits?.maxTextureSize??7680,limits?.maxRenderbufferSize??7680,limits?.maxViewportHeight??7680));
  const hardwareScale=Math.min(1,maxW/requestedWidth,maxH/requestedHeight,Math.sqrt(7680*4320/(requestedWidth*requestedHeight)));
  ratio*=hardwareScale*Math.max(.5,Math.min(1,adaptiveScale));
  return {ratio,width:Math.max(1,Math.floor(w*ratio)),height:Math.max(1,Math.floor(h*ratio)),limited:hardwareScale<.9999,requestedWidth,requestedHeight};
}
export function graphicsPreset(id:string):Partial<Settings>{return {quality:'ultra',renderResolution:id==='uhd'?'8k':id==='4k'?'4k':'auto',adaptive:false};}
