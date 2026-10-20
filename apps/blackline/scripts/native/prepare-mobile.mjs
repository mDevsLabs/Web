import {cpSync,existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../../',import.meta.url)),mobile=root+'apps/mobile/',source=root+'dist',target=mobile+'web';
if(!existsSync(source+'/index.html'))throw new Error('Compilez le jeu avec npm run build.');
rmSync(target,{recursive:true,force:true});cpSync(source,target,{recursive:true});
if(!existsSync(mobile+'node_modules/@capacitor/app')){
  const {execFileSync}=await import('node:child_process');
  console.log('Mobile : installation des dépendances dans apps/mobile...');
  const npmCmd=process.platform==='win32'?'npm.cmd':'npm';
  execFileSync(npmCmd,['ci'],{cwd:mobile,stdio:'inherit'});
}
const require=createRequire(mobile+'package.json'),{build}=require('esbuild');
await build({entryPoints:[mobile+'native-bridge.js'],bundle:true,format:'iife',target:'es2022',minify:true,outfile:target+'/native-bridge.js'});
const html=readFileSync(target+'/index.html','utf8').replace('</head>','<script src="./native-bridge.js" defer></script></head>');writeFileSync(target+'/index.html',html);
console.log('Mobile : jeu, paysage et export natif embarqués.');
