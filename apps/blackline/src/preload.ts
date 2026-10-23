export const nextPaint=()=>new Promise<void>(resolve=>{if(typeof document!=='undefined'&&document.hidden)setTimeout(resolve,20);else requestAnimationFrame(()=>resolve());});
export async function bounded<T>(task:Promise<T>,milliseconds:number):Promise<T|undefined>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([task,new Promise<undefined>(resolve=>{timer=setTimeout(()=>resolve(undefined),milliseconds);})]);}finally{if(timer!==undefined)clearTimeout(timer);}}
export function loadingProgress(onUpdate:(value:number,label:string)=>void){let previous=0;return(value:number,label:string)=>{previous=Math.max(previous,Math.max(0,Math.min(100,Math.round(value))));onUpdate(previous,label);};}
export async function nextTask(){
  if(typeof document!=='undefined'&&document.hidden)await new Promise<void>(resolve=>{const resume=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',resume);resolve();}};document.addEventListener('visibilitychange',resume);});
  await new Promise<void>(resolve=>{if(typeof window!=='undefined'&&typeof window.requestIdleCallback==='function')window.requestIdleCallback(()=>resolve(),{timeout:100});else setTimeout(resolve,0);});
}
// A timed-out compilation remains the only GPU job. Its resources are retained until it settles.
export async function compileStage(task:()=>Promise<unknown>,release:()=>void,timeout:number){let promise:Promise<unknown>;try{promise=Promise.resolve(task());}catch{release();return false;}
  const settled=promise.then(()=>true,()=>false).finally(release);const result=await bounded(settled,timeout);return result===true;
}
