import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
const COOKIE='blackline_session';
function secret(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error('Session is not configured');return value;}
function signature(value){return createHmac('sha256',secret()).update(value).digest('base64url');}
export function makeSession(id=randomUUID(),now=Date.now()){
  const payload=Buffer.from(JSON.stringify({id,expires:now+30*86400000})).toString('base64url');return {id,token:payload+'.'+signature(payload)};
}
export function readSession(token,now=Date.now()){
  if(typeof token!=='string'||token.length>500)return null;const parts=token.split('.');if(parts.length!==2)return null;const [payload,sig]=parts;if(!payload||!sig)return null;
  try{const expected=Buffer.from(signature(payload)),actual=Buffer.from(sig);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return /^[a-f0-9-]{36}$/i.test(data.id)&&data.expires>now?data.id:null;}catch{return null;}
}
export function sessionFromRequest(request){const cookie=request.headers.get('cookie')??'';const token=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return readSession(token);}
export function sessionCookie(token,secure=true){return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure?'; Secure':''}`;}
export function sameOrigin(request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
