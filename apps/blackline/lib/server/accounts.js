import { scrypt, randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive=promisify(scrypt),COOKIE='blackline_account';
const options={N:32768,r:8,p:1,maxmem:64*1024*1024};
export function authConfigured(){return process.env.AUTH_ENABLED==='true'&&!!process.env.DATABASE_URL&&(process.env.SESSION_SECRET?.length??0)>=32;}
export function credentials(value){
  const email=typeof value?.email==='string'?value.email.trim().toLowerCase():'';
  const password=value?.password;
  if(email.length>254||!/^([^\s@]{1,64})@([^\s@]+\.[^\s@]+)$/.test(email)||typeof password!=='string'||password.length<12||password.length>128)throw new Error('Adresse e-mail valide et mot de passe de 12 à 128 caractères requis.');
  return {email,password};
}
export async function hashPassword(password,salt=randomBytes(16).toString('hex')){const key=await derive(password,salt,64,options);return `scrypt-v1$${salt}$${key.toString('hex')}`;}
export async function verifyPassword(password,encoded){
  const [version,salt,hash]=String(encoded??'').split('$');if(version!=='scrypt-v1'||!/^\w{32}$/.test(salt??'')||!/^[a-f0-9]{128}$/.test(hash??''))return false;
  const key=await derive(password,salt,64,options);return timingSafeEqual(key,Buffer.from(hash,'hex'));
}
export const tokenHash=token=>createHash('sha256').update(token).digest('hex');
export const newAccountToken=()=>randomBytes(32).toString('base64url');
export function accountToken(request){const token=(request.headers.get('cookie')??'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return /^[a-zA-Z0-9_-]{43}$/.test(token??'')?token:null;}
export function accountCookie(token,secure=true){return `${COOKIE}=${token??''}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${token?2592000:0}${secure?'; Secure':''}`;}
export async function accountFromRequest(request,sql){
  const token=accountToken(request);if(!token||!authConfigured())return null;
  const rows=await sql`SELECT a.id,a.player_id,a.email,p.callsign FROM account_sessions s JOIN accounts a ON a.id=s.account_id JOIN players p ON p.id=a.player_id WHERE s.token_hash=${tokenHash(token)} AND s.expires_at>now()`;return rows[0]??null;
}
export async function resolvePlayer(request,sql,guest){
  const account=await accountFromRequest(request,sql);if(account)return account.player_id;
  if(!guest)return null;const owner=await sql`SELECT id FROM accounts WHERE player_id=${guest}`;return owner.length?null:guest;
}
export function rateKey(label){return createHmac('sha256',process.env.SESSION_SECRET).update(label).digest('hex');}
export async function rateAllowed(sql,key,max){
  const rows=await sql`INSERT INTO auth_limits(key_hash) VALUES (${rateKey(key)}) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN auth_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE auth_limits.attempts+1 END,window_start=CASE WHEN auth_limits.window_start<now()-interval '15 minutes' THEN now() ELSE auth_limits.window_start END RETURNING attempts`;return rows[0].attempts<=max;
}
