export interface Collection {purchases:string[];shot:'standard'|'ion'|'violet';kill:'none'|'pulse';}
export interface ShopItem {id:string;kind:'weapon'|'shot'|'kill';target:string;name:string;subtitle:string;price:number;rarity:string;color:string;description:string;}
export const SHOP_ITEMS:ShopItem[];
export const FREE_WEAPONS:string[];
export function integer(value:unknown):number;
export function normalizeCollection(value:unknown,xp?:number):Collection;
export function wallet(profile:{xp:number;collection?:Collection}):number;
export function ownsWeapon(collection:Collection|undefined,id:string):boolean;
export function purchase(profile:{xp:number;collection?:Collection},id:string):{ok:boolean;message:string};
export function equipItem(profile:{xp:number;weapon:string;collection?:Collection;career?:{loadout:string[]}},id:string):boolean;
export function effectColor(id?:string):number;
