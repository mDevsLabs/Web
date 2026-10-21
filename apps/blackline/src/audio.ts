import { clamp } from './math.ts';
export class GameAudio {
  context:AudioContext|null=null; master:GainNode|null=null; noise:AudioBuffer|null=null;volume=.6;
  init(){if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);const n=this.context.createBuffer(1,this.context.sampleRate,this.context.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=n;}if(this.context.state==='suspended')void this.context.resume();}
  setVolume(v:number){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(v,this.context!.currentTime,.05);}
  tone(freq:number,duration=.1,type:OscillatorType='sine',gain=.15){if(!this.context||!this.master)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);}
  burst(duration:number,lowpass:number,gain:number,pan=0){if(!this.context||!this.master||!this.noise)return;const c=this.context,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),p=typeof c.createStereoPanner==='function'?c.createStereoPanner():null;s.buffer=this.noise;f.type='lowpass';f.frequency.setValueAtTime(lowpass,t);f.frequency.exponentialRampToValueAtTime(100,t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);if(p){p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(this.master);}else g.connect(this.master);s.start(t);s.stop(t+duration);}
  shot(id='ar',distance=0,pan=0){const atten=1/(1+distance*.08);this.burst(id==='dmr'?.3:.15,2200,id==='dmr'?.6*atten:.4*atten,pan);this.tone(id==='smg'?130:80,.12,'triangle',.2*atten);}
  footstep(sprint=false){this.burst(.055,450,sprint?.11:.055);}
  reload(){this.burst(.12,3500,.12);this.tone(380,.07,'square',.025);}
  reloadStep(stage:number){if(stage===1){this.burst(.09,1900,.075);this.tone(230,.06,'triangle',.025);}else if(stage===2){this.burst(.12,2600,.1);this.tone(520,.045,'square',.018);}else {this.burst(.075,4800,.085);this.tone(740,.03,'triangle',.03);}}
  hit(head=false){this.tone(head?1300:820,.075,'sine',.2);this.tone(head?2000:1100,.05,'triangle',.08);}
  kill(){this.tone(550,.14,'sine',.12);this.tone(880,.2,'sine',.08);}
  explosion(distance=0){this.burst(1,1300,.8/(1+distance*.06));this.tone(45,.75,'sine',.4/(1+distance*.06));}
  ui(){this.tone(920,.05,'sine',.045);}
  /**
   * Ferme le contexte audio.
   *
   * Un `AudioContext` ouvert garde un fil d'exécution et son buffer : sans
   * fermeture, il survit au démontage du jeu. Le contexte est mis à null
   * pour qu'un `init()` ultérieur le rouvre proprement.
   */
  dispose(){if(!this.context)return;const context=this.context;this.context=null;this.master=null;this.noise=null;try{void context.close();}catch{/* un contexte déjà fermé ne doit pas faire échouer le démontage */}}
}
