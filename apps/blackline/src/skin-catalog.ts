export const SKINS=[
  {id:'factory',name:'Graphite',level:1,body:'#596c65',accent:'#9b9d7a',pattern:'Métal brossé · polymère texturé'},
  {id:'arctic',name:'Arctique',level:1,body:'#b2c5cd',accent:'#527985',pattern:'Éclats glacier · acier bleui'},
  {id:'ember',name:'Braise',level:4,body:'#934f3e',accent:'#ddb063',pattern:'Céramique cuivrée · lignes dorées'},
  {id:'night',name:'Circuit',level:8,body:'#334b57',accent:'#7edbc4',pattern:'Graphite bleu · circuit menthe'},
] as const;
export type SkinId=typeof SKINS[number]['id'];
export function allowedSkin(value:unknown,level=20):SkinId{return SKINS.find(s=>s.id===value&&s.level<=level)?.id??'factory';}
