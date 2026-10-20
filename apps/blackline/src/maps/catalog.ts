import type {MapId} from '../types.ts';
export const MAP_IDS:MapId[]=['harbor','outpost','forest','foundry'];
export const ARENAS={
 harbor:{name:'PORT DE NEREÏS',short:'NEREÏS',subtitle:'PORT INDUSTRIEL · CRÉPUSCULE',description:'Conteneurs, quais et longues lignes de tir.',width:120,depth:100,fog:0x7e969b,ground:0x78807a,top:0x385d7a,horizon:0xc5bdad,sun:0xffd2a1},
 outpost:{name:'BASTION KESTREL',short:'KESTREL',subtitle:'BASE DÉSERTIQUE · AUBE',description:'Murets de sable, poste radar et places ouvertes.',width:120,depth:100,fog:0xaea48d,ground:0xab987a,top:0x647b8b,horizon:0xdecdb1,sun:0xffe4b3},
 forest:{name:'RÉSERVE SYLVE',short:'SYLVE',subtitle:'STATION FORESTIÈRE · BRUME',description:'Bosquets denses, sentiers et pavillons de garde.',width:136,depth:112,fog:0x758d80,ground:0x6a7958,top:0x547c86,horizon:0xa8c4b1,sun:0xd9ead9},
 foundry:{name:'FONDERIE VULCAIN',short:'VULCAIN',subtitle:'ACIÉRIE · COUCHER DE SOLEIL',description:'Rails, ateliers en briques et chicanes de fret.',width:144,depth:112,fog:0x9d8170,ground:0x756b62,top:0x564e65,horizon:0xd4a47c,sun:0xffb36e},
} satisfies Record<MapId,{name:string;short:string;subtitle:string;description:string;width:number;depth:number;fog:number;ground:number;top:number;horizon:number;sun:number}>;
