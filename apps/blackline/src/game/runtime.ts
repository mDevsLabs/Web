import type { AIContext } from '../ai.ts';
import type { Game } from '../game.ts';
import { damp } from '../math.ts';
import { squadOrders } from '../squad.ts';
import { scheduleFrame,suspendFrame } from './frame-control.ts';
import { FramePacer } from './frame-pacer.ts';
import { idleRender,targetFPS } from './performance-policy.ts';
import { simulationSlices } from './timing.ts';
export function renderFrame(this:Game,now:number):void{
    this.frameRequest=undefined;if(this.disposed||this.preparing)return;if(document.hidden){suspendFrame.call(this);return;}const idle=idleRender(this.state,this.settings);if(idle&&this.renderDirty===false)return;this.pacer??=new FramePacer();const limit=targetFPS(this.state,this.settings);if(!this.pacer.due(now,limit)){scheduleFrame.call(this,this.pacer.delay(performance.now()));return;}this.pacer.rendered(now);const rawDt=(now-this.lastFrame)/1000,dt=Math.min(.1,Math.max(.001,rawDt));this.lastFrame=now;this.frames++;this.fpsTime+=rawDt;
    if(this.fpsTime>=1){this.fps=Math.round(this.frames/this.fpsTime);this.frames=0;this.fpsTime=0;this.hooks.performance(this.fps,this.resolution);
      if(this.settings.adaptive&&(this.state==='playing'||this.state==='dead')){if(this.fps<limit*.76)this.slowTime++;else if(this.fps>limit*.96)this.slowTime--;else this.slowTime=0;if(this.slowTime>=3&&this.adaptiveScale>.53){this.adaptiveScale=Math.max(.5,this.adaptiveScale-.1);this.slowTime=0;this.resize();}else if(this.slowTime<=-7&&this.adaptiveScale<1){this.adaptiveScale=Math.min(1,this.adaptiveScale+.05);this.slowTime=0;this.resize();}}
    }
    if(this.state==='menu'){this.menuTime+=this.settings.reduceMotion||this.settings.batterySaver?0:dt;this.camera.position.set(-31+Math.sin(this.menuTime*.055)*4,13+Math.sin(this.menuTime*.08)*.45,38+Math.cos(this.menuTime*.055)*3);this.camera.lookAt(4,2,-7);if(!this.settings.batterySaver){this.world.update(dt);this.effects.update(dt);}}
    else if(this.state==='playing'||this.state==='dead'){
      let simulated=0;for(const slice of simulationSlices(rawDt)){simulated+=slice;const dt=slice;if(this.state!=='playing'&&this.state!=='dead')break;
      this.time+=dt;this.matchTime+=dt;this.updatePlayer(dt);
      if(this.state==='playing'||this.state==='dead'){
        const ctx:AIContext={time:this.time,map:this.world.map,nav:this.nav,actors:this.actors,objectives:this.objectives,mode:this.config.mode,noises:this.noises,intel:this.intel,supplies:this.supplies,orders:this.orders,hazards:this.grenades.map(g=>({position:{x:g.mesh.position.x,y:g.mesh.position.y,z:g.mesh.position.z},remaining:2.5-g.age,team:g.owner.team})),grenade:(a,target)=>this.throwBotGrenade(a,target),shoot:(a,d)=>this.shoot(a,d)};
        if(this.time>=this.nextSquad){for(const reports of this.intel)for(const [id,r]of reports)if(this.time-r.time>6)reports.delete(id);this.orders=squadOrders(ctx);ctx.orders=this.orders;this.nextSquad=this.time+.65;}
        for(const b of this.brains){if(!b.actor.alive&&(this.config.mode!=='survival'||b.actor.team===0)){b.actor.respawnTime-=dt;if(b.actor.respawnTime<=0){this.spawn(b.actor);b.reset();}}else if(!b.actor.alive)b.actor.respawnTime-=dt;b.step(dt,ctx);}
        this.noises=this.noises.filter(n=>this.time-n.time<3);this.updateGrenades(dt);this.updateSupplies();this.updateModes(dt);this.hitTime=Math.max(0,this.hitTime-dt);this.damageFlash=damp(this.damageFlash,0,4,dt);
      }
      this.hudTime+=dt;}this.updateVisuals(simulated);this.world.update(simulated);this.effects.update(simulated);if(this.hudTime>1/(this.settings.batterySaver?15:30)||this.hitTime>.14){this.hudTime=0;this.hooks.hud(this.snapshot());}
    }
    this.film.uniforms.time.value=now*.001;
    // Render the full Ultra shadow map at 60 Hz (30 in economy), independent of a 120 Hz image.
    if(this.renderer.shadowMap&&now-(this.lastShadowFrame??0)>=1000/(this.settings.batterySaver?30:60)-.75){this.renderer.shadowMap.needsUpdate=true;this.lastShadowFrame=now;}
    this.composer.render();if(this.state==='playing'||this.state==='paused'){this.renderer.autoClear=false;this.renderer.clearDepth();if(this.gun.visible)this.renderer.render(this.gunScene,this.gunCamera);this.renderer.autoClear=true;}
    this.renderDirty=false;if(!idle)scheduleFrame.call(this,this.pacer.delay(performance.now()));
  }
