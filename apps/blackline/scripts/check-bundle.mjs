import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Contrôle du bundle de BLACKLINE.
//
// Ce que ce script GARDE :
//
//  1. le budget de taille des chunks (le moteur ne doit pas être noyé dans un
//     chunk monolithique) ;
//  2. l'absence de chaîne de connexion dans le bundle (elle ne doit JAMAIS
//     atteindre le navigateur) ;
//  3. la cascade CSS (un seul point d'entrée, sinon l'ordre des feuilles
//     change et les overlays de gameplay s'empilent dans le désordre) ;
//  4. le LAZY LOADING DU MOTEUR : l'interface doit s'afficher SANS le moteur,
//     qui n'arrive qu'au lancement d'une opération ;
//  5. le CONTRAT D'INTÉGRATION : le chunk d'entrée doit publier
//     `window.blackline`.
//
// Le POINT 5 est aussi important que les quatre autres : l'hôte mAI
// monte le jeu par ce contrat. S'il disparaît, le jeu ne se monte pas — et
// l'échec est SILENCIEUX, puisque le chargement du module réussit.
const assets=join(process.cwd(),'dist/assets'),files=readdirSync(assets).filter(f=>f.endsWith('.js'));
const largest=Math.max(...files.map(f=>statSync(join(assets,f)).size));
if(files.length<4||largest>600000)throw new Error('JavaScript chunk budget exceeded or splitting missing');
for(const file of files){const content=readFileSync(join(assets,file),'utf8');if(/postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/.test(content))throw new Error('Database connection leaked into browser bundle');}

// La cascade CSS : un SEUL point d'entrée, `src/mount.ts`.
const entry=readFileSync(join(process.cwd(),'src/mount.ts'),'utf8');
if(!entry.includes("import './theme.css'"))throw new Error('CSS cascade must use the single theme entry');

// Le contrat d'intégration : `window.blackline` est publié par le chunk
// d'entrée. Un export nommé pourrait être élagué — le contrat, lui, ne peut
// pas l'être.
const entryChunk=readFileSync(join(assets,'blackline.js'),'utf8');
if(!/window\.blackline/.test(entryChunk))throw new Error('The entry chunk does not publish window.blackline');
if(!/mount:/.test(entryChunk))throw new Error('The entry chunk does not expose a mount() contract');
// `unmount` est le pendant de `mount` : sans lui, l'hôte ne peut que
// retirer la balise <script>, et le moteur continue de tourner — boucle de
// rendu active, contexte WebGL jamais relâché.
if(!/unmount:/.test(entryChunk))throw new Error('The entry chunk does not expose an unmount() contract');

const html=readFileSync(join(process.cwd(),'dist/index.html'),'utf8');
const preloads=[...html.matchAll(/rel="modulepreload"[^>]+href="([^"]+)"/g)].map(m=>m[1]);
if(preloads.some(p=>/three-core|three-effects|world-models|game-|page-arsenal|page-shop|page-guide/.test(p)))throw new Error('The engine is loaded before the interface');
console.log(JSON.stringify({javascriptChunks:files.length,largestChunkBytes:largest,engineLoadedLazily:true,contractPublished:true}));
