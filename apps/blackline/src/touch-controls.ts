import type { TouchAction,TouchInput } from './input.ts';
export class TouchControls {
  captures=new Map<number,HTMLElement>();cleanups:(()=>void)[]=[];
  constructor(readonly root:HTMLElement,readonly input:TouchInput,readonly callbacks:{allowed:(action?:TouchAction)=>boolean;look:(x:number,y:number)=>void;action:(action:TouchAction)=>void}){
    for(const el of root.querySelectorAll<HTMLElement>('[data-touch]'))this.bind(el);
    const reset=()=>this.reset();window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);
    this.cleanups.push(()=>window.removeEventListener('blur',reset),()=>window.removeEventListener('orientationchange',reset));
    root.addEventListener('contextmenu',this.prevent);this.cleanups.push(()=>root.removeEventListener('contextmenu',this.prevent));
  }
  prevent=(event:Event)=>event.preventDefault();
  bind(el:HTMLElement){
    const kind=el.dataset.touch!,role=kind==='move'||kind==='look'||kind==='fire'?kind:'action';
    const down=(event:PointerEvent)=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      const action=kind as TouchAction;if(!this.callbacks.allowed(action))return;
      event.preventDefault();event.stopPropagation();
      if(role==='action'&&[...this.captures.values()].includes(el))return;
      const rect=el.getBoundingClientRect(),center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      if(!this.input.begin(event.pointerId,role,{x:event.clientX,y:event.clientY},center,rect.width*.38))return;
      this.captures.set(event.pointerId,el);try{el.setPointerCapture(event.pointerId);}catch{}
      el.classList.add('pressed');
      if(role==='action'||role==='fire')this.callbacks.action(action);
      this.paintJoystick();
    };
    const move=(event:PointerEvent)=>{
      if(this.captures.get(event.pointerId)!==el)return;event.preventDefault();event.stopPropagation();
      const delta=this.input.update(event.pointerId,{x:event.clientX,y:event.clientY});
      if(delta)this.callbacks.look(delta.x,delta.y);this.paintJoystick();
    };
    const end=(event:PointerEvent)=>{
      if(this.captures.get(event.pointerId)!==el)return;if(event.cancelable)event.preventDefault();event.stopPropagation();
      this.captures.delete(event.pointerId);this.input.release(event.pointerId);
      if(![...this.captures.values()].includes(el))el.classList.remove('pressed');
      try{if(el.hasPointerCapture(event.pointerId))el.releasePointerCapture(event.pointerId);}catch{}
      this.paintJoystick();
    };
    el.addEventListener('pointerdown',down,{passive:false});el.addEventListener('pointermove',move,{passive:false});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,end as EventListener,{passive:false});
    this.cleanups.push(()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);for(const event of ['pointerup','pointercancel','lostpointercapture'])el.removeEventListener(event,end as EventListener);});
  }
  paintJoystick(){const knob=this.root.querySelector<HTMLElement>('.joystick-knob');if(knob)knob.style.transform=`translate(${this.input.side*(typeof document!=='undefined'&&document.documentElement?.classList?.contains('left-handed')?-35:35)}px,${-this.input.forward*35}px)`;}
  reflect(weaponId:string,aim:boolean,crouch:boolean,sprinting:boolean,scoreboard:boolean){
    for(const [key,active]of [['aim',aim],['crouch',crouch],['sprint',sprinting],['score',scoreboard]] as const){const b=this.root.querySelector<HTMLElement>(`[data-touch="${key}"]`);if(b){b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}}
    for(const button of this.root.querySelectorAll<HTMLElement>('[data-weapon-id]'))button.classList.toggle('active',button.dataset.weaponId===weaponId);
  }
  reset(){const captures=[...this.captures];this.captures.clear();this.input.reset();for(const [id,el]of captures){el.classList.remove('pressed');try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}}this.paintJoystick();}
  dispose(){this.reset();for(const cleanup of this.cleanups)cleanup();this.cleanups=[];}
}
