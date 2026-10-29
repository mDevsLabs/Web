import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { splitSQL } from '../lib/db/split-sql.js';
import { normalizeSave } from '../lib/server/validation.js';
import { makeSession, readSession, sessionFromRequest, sameOrigin } from '../lib/server/session.js';
import profile from '../api/profile.js';
import matches from '../api/matches.js';
test('une session signée ne peut pas être modifiée et expire',()=>{
  const old=process.env.SESSION_SECRET;process.env.SESSION_SECRET='x'.repeat(64);
  try{const s=makeSession('00000000-0000-4000-8000-000000000001',1000);assert.equal(readSession(s.token,1001),s.id);assert.equal(readSession(s.token+'x',1001),null);assert.equal(readSession(s.token,1000+31*86400000),null);
    const request=new Request('https://game.example/api/profile',{headers:{cookie:'other=1; blackline_session='+makeSession().token}});assert.ok(sessionFromRequest(request));
  }finally{if(old===undefined)delete process.env.SESSION_SECRET;else process.env.SESSION_SECRET=old;}
});
test('les sauvegardes bornent les compteurs et refusent les accessoires encore verrouillés',()=>{
  const save=normalizeSave({profile:{xp:-1,kills:Infinity,weapon:'bad',weaponProgress:{ar:{xp:0,equipped:['match-barrel']},pistol:{xp:2700,equipped:['fast-mag','fake']}}},settings:{callsign:'A'.repeat(40)}});
  assert.equal(save.profile.xp,0);assert.equal(save.profile.kills,0);assert.equal(save.profile.weapon,'ar');assert.equal(save.callsign.length,18);assert.deepEqual(save.profile.weaponProgress.ar.equipped,[]);assert.deepEqual(save.profile.weaponProgress.pistol.equipped,['fast-mag']);
});
test('le contrôle d’origine bloque les écritures externes',()=>{
  assert.equal(sameOrigin(new Request('https://game.example/api/profile',{headers:{origin:'https://other.example'}})),false);assert.equal(sameOrigin(new Request('https://game.example/api/profile',{headers:{origin:'https://game.example'}})),true);
});
test('les anciennes API sont retirées et ne tentent aucune connexion',async()=>{
  const old=process.env.DATABASE_URL;delete process.env.DATABASE_URL;
  try{assert.equal((await profile.fetch(new Request('https://game.example/api/profile'))).status,410);assert.equal((await matches.fetch(new Request('https://game.example/api/matches',{method:'POST',headers:{origin:'https://game.example'}}))).status,410);}finally{if(old!==undefined)process.env.DATABASE_URL=old;}
});
test('les migrations SQL gardent les littéraux et les blocs intacts',()=>{
  assert.deepEqual(splitSQL("SELECT 'a;b'; SELECT $$c;d$$; -- tail\nSELECT 3;"),["SELECT 'a;b'",'SELECT $$c;d$$','-- tail\nSELECT 3']);assert.throws(()=>splitSQL("SELECT 'broken"));
  const dir=new URL('../lib/db/migrations/',import.meta.url);let count=0;for(const file of readdirSync(dir)){const source=readFileSync(new URL(file,dir),'utf8');count+=splitSQL(source).length;assert.ok(!/DROP TABLE/i.test(source));}assert.ok(count>=8);
});
