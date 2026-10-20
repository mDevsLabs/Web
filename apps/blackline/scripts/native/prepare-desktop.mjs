import {cpSync,existsSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),source=root+'dist',target=root+'apps/desktop/dist';
if(!existsSync(source+'/index.html'))throw new Error('Compilez le jeu avec npm run build.');
rmSync(target,{recursive:true,force:true});cpSync(source,target,{recursive:true});
console.log('Desktop : jeu embarqué dans apps/desktop/dist.');
