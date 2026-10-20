import type { Game } from '../game.ts';
import { COYOTE_TIME,ladderExitClear,ladderStep,nearbyLadder } from '../traversal.ts';
export function interactLadder(this:Game){
  if(this.state!=='playing'||!this.player.alive||this.climbExit)return;
  if(this.activeLadder){
    if(this.settings.autoClimb!==false){this.ladderPaused=!this.ladderPaused;this.ladderInputArmed=false;}
    else {this.activeLadder=null;this.climbEntry=null;this.grounded=false;}
    return;
  }
  const ladder=nearbyLadder(this.player,this.world.map.props);
  if(!ladder)return;
  if(!ladderExitClear(ladder,this.world.map.props)){this.hooks.event('notice',{text:'La sortie de cette échelle est obstruée.'});return;}
  const fromRoof=this.player.y>=ladder.roofY-.3;
  this.activeLadder=ladder;this.ladderDirection=fromRoof?-1:1;this.ladderPaused=false;this.ladderInputArmed=false;
  this.climbEntry=fromRoof?{x:this.player.x,z:this.player.z,progress:0}:null;
  if(!fromRoof){this.player.x=ladder.x;this.player.z=ladder.z;}
  this.player.y=Math.min(this.player.y,ladder.roofY);this.player.yaw=0;this.player.pitch=0;
  this.velocityY=0;this.grounded=false;this.coyoteTime=0;this.jumpBuffer=0;this.slideTime=0;
  this.aimDown=false;this.mouseDown=false;this.fireBuffer=0;this.touch.aim=false;this.touch.crouch=false;this.touch.sprint=false;
}
export function updateLadder(this:Game,forward:number,dt:number){
  const a=this.player;
  if(this.climbExit){
    const l=this.climbExit;this.climbExitProgress=Math.min(1,this.climbExitProgress+dt/.25);const t=this.climbExitProgress**2*(3-2*this.climbExitProgress);
    a.x=l.exit.x;a.z=l.z+(l.exit.z-l.z)*t;a.y=l.roofY;this.velocityY=0;this.grounded=false;
    if(t>=1){this.climbExit=null;this.grounded=true;this.coyoteTime=COYOTE_TIME;}
    return true;
  }
  const l=this.activeLadder;if(!l)return false;
  if(Math.abs(forward)<=.15)this.ladderInputArmed=true;
  if(this.climbEntry){const e=this.climbEntry;e.progress=Math.min(1,e.progress+dt/.25);const t=e.progress**2*(3-2*e.progress);a.x=e.x+(l.x-e.x)*t;a.z=e.z+(l.z-e.z)*t;a.y=l.roofY;if(t>=1)this.climbEntry=null;this.velocityY=0;this.grounded=false;return true;}
  const manual=this.settings.autoClimb===false||this.ladderInputArmed!==false;
  if(manual&&Math.abs(forward)>.15){this.ladderDirection=forward>0?1:-1;this.ladderPaused=false;}
  const input=manual&&Math.abs(forward)>.15?forward:this.settings.autoClimb!==false&&!this.ladderPaused?(this.ladderDirection??1):0;
  const step=ladderStep(l,a.y,input,dt);a.x=l.x;a.z=l.z;a.y=step.y;this.velocityY=0;this.grounded=false;
  if(step.finished==='roof'){this.climbExit=l;this.climbExitProgress=0;this.activeLadder=null;}
  else if(step.finished==='ground'){this.activeLadder=null;this.grounded=true;a.z=l.z+.22;}
  return true;
}
