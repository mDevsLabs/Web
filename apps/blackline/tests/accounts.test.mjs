import test from 'node:test';
import assert from 'node:assert/strict';
import { credentials,hashPassword,verifyPassword,authConfigured,accountToken,accountCookie,newAccountToken,tokenHash,resolvePlayer,rateAllowed } from '../lib/server/accounts.js';
import auth from '../api/auth.js';
test('les mots de passe utilisent un sel unique et le hachage ne contient pas le mot de passe',async()=>{
  const password='A strong passphrase 42!',a=await hashPassword(password),b=await hashPassword(password);assert.notEqual(a,b);assert.equal(a.includes(password),false);assert.equal(await verifyPassword(password,a),true);assert.equal(await verifyPassword('wrong password 42!',a),false);assert.equal(await verifyPassword(password,'invalid'),false);
});
test('la validation des comptes normalise l’adresse et refuse les entrées trop courtes ou excessives',()=>{
  assert.deepEqual(credentials({email:' Example@DOMAIN.COM ',password:'abcdefghijkl'}),{email:'example@domain.com',password:'abcdefghijkl'});for(const value of [{email:'bad',password:'abcdefghijkl'},{email:'a@b.com',password:'short'},{email:'a@b.com',password:'x'.repeat(129)}])assert.throws(()=>credentials(value));
});
test('les sessions de compte utilisent des jetons aléatoires et un cookie HttpOnly limité à la même origine',()=>{
  const token=newAccountToken();assert.notEqual(token,newAccountToken());assert.equal(token.length,43);assert.equal(tokenHash(token).length,64);assert.equal(accountToken(new Request('https://g.example',{headers:{cookie:'blackline_account='+token}})),token);assert.ok(accountCookie(token).includes('HttpOnly; SameSite=Lax'));assert.ok(accountCookie(null).includes('Max-Age=0'));assert.equal(accountToken(new Request('https://g.example',{headers:{cookie:'blackline_account=bad'}})),null);
});
test('les comptes absents restent explicitement désactivés et une session invitée ne donne pas accès à un compte',async()=>{
  const old=process.env.AUTH_ENABLED;process.env.AUTH_ENABLED='false';try{assert.equal(authConfigured(),false);const response=await auth.fetch(new Request('https://g.example/api/auth'));assert.equal(response.status,410);assert.equal((await response.json()).available,false);
    assert.equal(await resolvePlayer(new Request('https://g.example'),async()=>[{id:'owner'}],'guest-id'),null);assert.equal(await resolvePlayer(new Request('https://g.example'),async()=>[],'guest-id'),'guest-id');
  }finally{if(old===undefined)delete process.env.AUTH_ENABLED;else process.env.AUTH_ENABLED=old;}
});
test('la limitation des tentatives refuse les essais dépassant le seuil',async()=>{
  const old=process.env.SESSION_SECRET;process.env.SESSION_SECRET='x'.repeat(64);try{assert.equal(await rateAllowed(async()=>[{attempts:10}],'test',10),true);assert.equal(await rateAllowed(async()=>[{attempts:11}],'test',10),false);}finally{if(old===undefined)delete process.env.SESSION_SECRET;else process.env.SESSION_SECRET=old;}
});
