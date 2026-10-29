import type { HUDData } from './game.ts';
import { distance } from './math.ts';
import { roleFor } from './squad.ts';

const safe=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const roles={assault:'ASSAUT',anchor:'SOUTIEN',flanker:'FLANC'};
const states:Record<string,string>={cover:'COUVERT',peek:'DÉBORDEMENT',engage:'CONTACT',evade:'GRENADE',capture:'OBJECTIF',rotate:'ROTATION',retreat:'REPLI',resupply:'RAVITAILLEMENT',flank:'FLANC',hold:'DÉFENSE',investigate:'RECHERCHE',search:'RECHERCHE',patrol:'EN ROUTE'};
export function squadMarkup(data:HUDData){
  const allies=data.actors.filter(a=>!a.player&&a.team===data.player.team).sort((a,b)=>Number(b.alive)-Number(a.alive)||distance(a,data.player)-distance(b,data.player));
  if(!allies.length)return '';
  return `<div class="squad-caption">ESCOUADE <b>${allies.filter(a=>a.alive).length}/${allies.length}</b></div>${allies.slice(0,4).map(a=>`<div class="squad-unit ${a.alive?'':'down'}"><span><b>${safe(a.name)}</b><small>${a.alive?roles[roleFor(a.id)]:'À TERRE'}</small></span><i><b style="width:${Math.min(100,Math.max(0,a.hp))}%"></b></i><small>${a.alive?states[a.tacticalState??'patrol']:Math.max(0,Math.ceil(a.respawnTime))+' S'}</small></div>`).join('')}`;
}
export function hardpointMarkup(data:HUDData){
  const point=data.objectives[data.pointIndex],next=data.objectives[data.pointNext];if(!point||!next)return '';
  const state=point.contested?'CONTESTÉ':point.owner===data.player.team?'SOUS CONTRÔLE':point.owner===-1?'À SÉCURISER':'HOSTILE';
  return `<span class="point-live obj-${point.owner===0?'ally':point.owner===1?'enemy':'neutral'}"><b>${point.id}</b> ${state}</span><span class="point-rotation">${Math.ceil(data.pointRemaining)} S <i>→ ${next.id}</i></span>`;
}
