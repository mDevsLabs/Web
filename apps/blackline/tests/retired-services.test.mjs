// Ce fichier portait trois vérifications. Deux concernaient le conditionnement
// natif Electron/Capacitor (`apps/blackline/apps/`) et le workflow GitHub
// imbriqué qui le construisait : ce conditionnement a été retiré du dépôt,
// et avec lui les deux vérifications correspondantes.
//
// La troisième reste entière et vérifie ce qui est encore en place : les
// services retirés (comptes, profil, matchs) répondent TOUJOURS 410 et ne
// peuvent pas être réactivés par une ancienne session ou une configuration
// Neon resurgente. C'est le garde-fou le plus utile du jeu.
import test from 'node:test';import assert from 'node:assert/strict';import auth from '../api/auth.js';import profile from '../api/profile.js';import matches from '../api/matches.js';
test('aucune ancienne session ou configuration Neon ne réactive les connexions supprimées',async()=>{const before={AUTH_ENABLED:process.env.AUTH_ENABLED,DATABASE_URL:process.env.DATABASE_URL};process.env.AUTH_ENABLED='true';process.env.DATABASE_URL='invalid-unreachable';try{for(const handler of [auth,profile,matches])for(const method of ['GET','POST','PUT']){const response=await handler.fetch(new Request('https://game.example/api/retired',{method,headers:{cookie:'blackline_account=old; blackline_session=old'}}));assert.equal(response.status,410);const body=await response.json();assert.equal(body.authenticated,false);assert.equal(body.enabled,false);assert.ok(response.headers.get('set-cookie').includes('Max-Age=0'));}}finally{for(const key of Object.keys(before))if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}});
