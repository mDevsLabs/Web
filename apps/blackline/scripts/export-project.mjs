import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(readFileSync(join(project,'package.json'),'utf8'));
const filename=`BLACKLINE-${pkg.version}.zip`,output=resolve(process.argv[2]??join(project,filename));
if(existsSync(output))throw new Error('L’archive existe déjà : choisissez un nouveau chemin pour préserver cette version.');
if(!existsSync(join(project,'dist/index.html')))throw new Error('Exécutez npm run build avant l’export.');
const temporary=mkdtempSync(join(tmpdir(),'blackline-export-')),folder=`BLACKLINE-${pkg.version}`,staging=join(temporary,folder);
try{
  // Explicit allowlist: no credentials, dependencies, Git or hosting-local metadata.
  for(const entry of ['src','public','apps','tests','scripts','dist','api','lib','docs','.github','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','vercel.json','README.md','CONTRIBUTING.md','.env.example','.gitignore']){
    const input=join(project,entry);if(existsSync(input))cpSync(input,join(staging,entry),{recursive:true,filter:source=>!['node_modules','android','ios','web','release'].includes(basename(source))&&source!==join(project,'apps','desktop','dist')});
  }
  let commit='export local';try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:project,encoding:'utf8'}).trim();}catch{}
  writeFileSync(join(staging,'BUILD_INFO.txt'),`BLACKLINE ${pkg.version}\nSource commit: ${commit}\nPC et mobile — jeu solo contre bots, progression locale, applications Electron/Capacitor\n\nSources: src/ ; tests: tests/ ; version compilée: dist/\nNode.js 24 ; npm ci ; npm run dev ; docs/DEPLOYMENT.md ; docs/NATIVE-APPS.md\nVérification: npm run typecheck ; npm test\nProduction: npm run build ; npm run preview\n\nCe ZIP n’inclut ni node_modules, ni historique Git, ni identifiants de publication.\nLa compilation GPU et les performances sur appareil restent à vérifier.\n`);
  try{
    execFileSync('zip',['-q','-r',output,folder],{cwd:temporary});
  }catch(err){
    if(err&&(err.code==='ENOENT'||err.status!==0)){
      try{
        execFileSync('tar',['-a','-c','-f',output,folder],{cwd:temporary});
      }catch{
        execFileSync('powershell',['-NoProfile','-Command',`Compress-Archive -Path '${join(temporary,folder)}' -DestinationPath '${output}' -Force`]);
      }
    }else{
      throw err;
    }
  }
  console.log(JSON.stringify({archive:output,bytes:statSync(output).size,version:pkg.version,commit}));
}finally{rmSync(temporary,{recursive:true,force:true});}
