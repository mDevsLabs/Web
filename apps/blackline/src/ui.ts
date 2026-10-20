import { normalizeCareer } from '../lib/game/career.js';
import { normalizeCollection } from '../lib/game/shop-catalog.js';
import { SaveController } from './save-controller.ts';
import type { Game,GameState,HUDData } from './game.ts';
import { visible } from './math.ts';
import { normalizeProgress } from './progression.ts';
import { TouchControls } from './touch-controls.ts';
import type { MatchConfig,MatchResult,Profile,Settings } from './types.ts';
import * as menu_bindings from './ui/menu-bindings.ts';
import { pageMarkup } from './ui/page-loader.ts';
import * as settings_bindings from './ui/settings-bindings.ts';

import * as feedback from './ui/feedback.ts';
import * as hud_controller from './ui/hud-controller.ts';
import * as menu_controller from './ui/menu-controller.ts';
import { settingsMarkup } from './ui/settings.ts';
import { weaponGraphic } from './ui/weapon-graphic.ts';

export { icon } from './ui/icons.ts';

export class UI {
  saves:SaveController;game:Game|null=null;screen='play';config:MatchConfig;state:GameState='menu';lastResult:MatchResult|null=null;
  shopFilter='all';engineReady=true;loadProgress=0;pausedSettings=false;killRows:{html:string;time:number}[]=[];toastTimer=0;noticeTimer=0;hudRefs:Record<string,HTMLElement>={};minimap:HTMLCanvasElement|null=null;lastMini=0;fps=0;resolution='';
  touchControls:TouchControls|null=null;
  damageTimer=0;bannerTimer=0;bindingCapture:AbortController|null=null;arsenalRotation?:{yaw:number;pitch:number;zoomFactor:number;};
  constructor(readonly app:HTMLElement,readonly settings:Settings,readonly profile:Profile,readonly mobile=false){this.config={mode:'tdm',map:'harbor',difficulty:'regular',bots:7,allies:3,enemies:4,weapon:profile.weapon,duration:300};this.saves=new SaveController(this);this.menu();}
  setGame(game:Game){this.game=game;this.profile.weaponProgress??=normalizeProgress({});game.progress=this.profile.weaponProgress;game.collection=normalizeCollection(this.profile.collection,this.profile.xp);game.career=normalizeCareer(this.profile.career,game.collection);this.bindMenu();}
  profileMarkup(...args:Parameters<typeof menu_controller.profileMarkup>):ReturnType<typeof menu_controller.profileMarkup>{return menu_controller.profileMarkup.apply(this,args);}
  menu(...args:Parameters<typeof menu_controller.menu>):ReturnType<typeof menu_controller.menu>{return menu_controller.menu.apply(this,args);}
  content(...args:Parameters<typeof menu_controller.content>):ReturnType<typeof menu_controller.content>{return menu_controller.content.apply(this,args);}
  playPage(...args:Parameters<typeof menu_controller.playPage>):ReturnType<typeof menu_controller.playPage>{return menu_controller.playPage.apply(this,args);}
  arsenal(){return pageMarkup(this,'arsenal');}
  weaponGraphic(id:string){return weaponGraphic(id);}
  settingsPage(){return settingsMarkup(this.settings,this.mobile,this.pausedSettings,this.resolution);}
  intel(...args:Parameters<typeof menu_controller.intel>):ReturnType<typeof menu_controller.intel>{return menu_controller.intel.apply(this,args);}
  bindMenu(...args:Parameters<typeof menu_bindings.bindMenu>):ReturnType<typeof menu_bindings.bindMenu>{return menu_bindings.bindMenu.apply(this,args);}
  bindSettings(...args:Parameters<typeof settings_bindings.bindSettings>):ReturnType<typeof settings_bindings.bindSettings>{return settings_bindings.bindSettings.apply(this,args);}
  bindKeys(...args:Parameters<typeof settings_bindings.bindKeys>):ReturnType<typeof settings_bindings.bindKeys>{return settings_bindings.bindKeys.apply(this,args);}
  stateChanged(...args:Parameters<typeof hud_controller.stateChanged>):ReturnType<typeof hud_controller.stateChanged>{return hud_controller.stateChanged.apply(this,args);}
  buildHUD(...args:Parameters<typeof hud_controller.buildHUD>):ReturnType<typeof hud_controller.buildHUD>{return hud_controller.buildHUD.apply(this,args);}
  touchMarkup(...args:Parameters<typeof hud_controller.touchMarkup>):ReturnType<typeof hud_controller.touchMarkup>{return hud_controller.touchMarkup.apply(this,args);}
  hud(...args:Parameters<typeof hud_controller.hud>):ReturnType<typeof hud_controller.hud>{return hud_controller.hud.apply(this,args);}
  drawMinimap(...args:Parameters<typeof hud_controller.drawMinimap>):ReturnType<typeof hud_controller.drawMinimap>{return hud_controller.drawMinimap.apply(this,args);}
  showPause(...args:Parameters<typeof feedback.showPause>):ReturnType<typeof feedback.showPause>{return feedback.showPause.apply(this,args);}
  event(...args:Parameters<typeof feedback.event>):ReturnType<typeof feedback.event>{return feedback.event.apply(this,args);}
  banner(...args:Parameters<typeof feedback.banner>):ReturnType<typeof feedback.banner>{return feedback.banner.apply(this,args);}
  notice(...args:Parameters<typeof feedback.notice>):ReturnType<typeof feedback.notice>{return feedback.notice.apply(this,args);}
  end(...args:Parameters<typeof feedback.end>):ReturnType<typeof feedback.end>{return feedback.end.apply(this,args);}
  performance(...args:Parameters<typeof feedback.performance>):ReturnType<typeof feedback.performance>{return feedback.performance.apply(this,args);}
}
function visibleForRadar(a:{x:number;y?:number;z:number},player:{x:number;y?:number;z:number},data:HUDData){return visible({x:player.x,y:(player.y??0)+1.6,z:player.z},{x:a.x,y:(a.y??0)+1.6,z:a.z},data.map.props);}
