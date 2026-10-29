// Shared by the browser and the save API: prices and ownership rules have one source.
export const SHOP_ITEMS=[
  {id:'weapon-carbine',kind:'weapon',target:'carbine',name:'CR-9 AURORA',subtitle:'Carabine légère',price:1400,rarity:'ARSENAL',color:'#d2c59f',description:'24 cartouches, recul modéré et bonne mobilité.'},
  {id:'weapon-marksman',kind:'weapon',target:'marksman',name:'S-96 HORIZON',subtitle:'Précision à verrou',price:1800,rarity:'ARSENAL',color:'#b5c4a8',description:'Cinq tirs à longue portée. Une cadence lente récompense la précision.'},
  {id:'weapon-shotgun',kind:'weapon',target:'shotgun',name:'SG-8 BREACHER',subtitle:'Fusil à pompe',price:750,rarity:'ARSENAL',color:'#d4ab75',description:'Six plombs par cartouche. Puissant de près, cadence et portée limitées.'},
  {id:'weapon-lmg',kind:'weapon',target:'lmg',name:'LM-60 BASTION',subtitle:'Mitrailleuse légère',price:1100,rarity:'ARSENAL',color:'#a6c8c0',description:'60 cartouches et tir de soutien. Lourde et plus lente à recharger.'},
  {id:'shot-ion',kind:'shot',target:'ion',name:'ION',subtitle:'Traînées & éclair de bouche',price:300,rarity:'SIGNATURE',color:'#77deed',description:'Traînées cyan et flash froid. Effet purement visuel.'},
  {id:'shot-violet',kind:'shot',target:'violet',name:'SPECTRE',subtitle:'Traînées & éclair de bouche',price:450,rarity:'SIGNATURE',color:'#b6a0ff',description:'Signature violette sur vos tirs. Aucun changement de dégâts.'},
  {id:'kill-pulse',kind:'kill',target:'pulse',name:'RÉSONANCE',subtitle:'Effet d’élimination',price:550,rarity:'SIGNATURE',color:'#dfb476',description:'Une onde lumineuse discrète marque vos éliminations.'},
];
export const FREE_WEAPONS=['ar','smg','dmr','pistol'];
export const integer=value=>Number.isFinite(value)?Math.min(10000000,Math.max(0,Math.floor(value))):0;
export function normalizeCollection(value,xp=0){
  const input=value&&typeof value==='object'?value:{},purchases=[];let left=400+Math.floor(integer(xp)/4);
  for(const id of Array.isArray(input.purchases)?input.purchases:[]){const item=SHOP_ITEMS.find(s=>s.id===id);if(!item||purchases.includes(id)||item.price>left)continue;purchases.push(id);left-=item.price;}
  const owns=(kind,target)=>SHOP_ITEMS.some(s=>s.kind===kind&&s.target===target&&purchases.includes(s.id));
  return {purchases,shot:owns('shot',input.shot)?input.shot:'standard',kill:owns('kill',input.kill)?input.kill:'none'};
}
export function wallet(profile){const collection=normalizeCollection(profile.collection,profile.xp),spent=SHOP_ITEMS.filter(s=>collection.purchases.includes(s.id)).reduce((sum,s)=>sum+s.price,0);return 400+Math.floor(integer(profile.xp)/4)-spent;}
export function ownsWeapon(collection,id){return FREE_WEAPONS.includes(id)||SHOP_ITEMS.some(s=>s.kind==='weapon'&&s.target===id&&collection?.purchases?.includes(s.id));}
export function purchase(profile,id){
  const item=SHOP_ITEMS.find(s=>s.id===id);if(!item)return {ok:false,message:'Article introuvable.'};
  const collection=normalizeCollection(profile.collection,profile.xp);if(collection.purchases.includes(id))return {ok:false,message:'Cet article est déjà dans votre collection.'};
  if(wallet(profile)<item.price)return {ok:false,message:'Crédits insuffisants. Gagnez de l’XP en terminant des opérations.'};
  collection.purchases.push(id);profile.collection=collection;return {ok:true,message:`${item.name} ajouté à votre collection.`};
}
export function equipItem(profile,id){
  profile.collection=normalizeCollection(profile.collection,profile.xp);const item=SHOP_ITEMS.find(s=>s.id===id);if(!item||!profile.collection.purchases.includes(id))return false;
  if(item.kind==='weapon'){const slots=profile.career?.loadout;if(Array.isArray(slots)&&!slots.includes(item.target)){const selected=slots.indexOf(profile.weapon),slot=selected>=0?selected:slots.findIndex(id=>ownsWeapon(profile.collection,id));if(slot>=0)slots[slot]=item.target;}profile.weapon=item.target;}else profile.collection[item.kind]=item.target;return true;
}
export function effectColor(id){return id==='ion'?0x77deed:id==='violet'?0xb6a0ff:0xffd9a2;}
