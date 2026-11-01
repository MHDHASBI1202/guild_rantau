import {env} from 'cloudflare:workers';
import {authCookie,cookieValue,randomToken,hashToken} from '../../../auth-core';
export async function GET(request:Request){
 const headers=new Headers({'Cache-Control':'no-store'}),clientId=env.GOOGLE_CLIENT_ID;
 if(import.meta.env.DEV&&env.AUTH_PROVIDER!=='google')return Response.json({available:true,local:true},{headers});
 if(!clientId||!clientId.endsWith('.apps.googleusercontent.com')||!env.DB)return Response.json({available:false},{status:503,headers});
 const secure=new URL(request.url).protocol==='https:',name=(secure?'__Host-':'')+'gr_challenge';let raw=cookieValue(request.headers.get('cookie'),name),now=Date.now();
 if(raw&&/^[a-f0-9]{64}$/.test(raw)){const row=await env.DB.prepare('SELECT nonce FROM auth_challenges WHERE token_hash=? AND expires_at>?').bind(await hashToken(raw),now).first<{nonce:string}>();if(row)return Response.json({available:true,clientId,nonce:row.nonce},{headers});}
 raw=randomToken();const nonce=randomToken();await env.DB.batch([env.DB.prepare('DELETE FROM auth_challenges WHERE expires_at<=?').bind(now),env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),env.DB.prepare('INSERT INTO auth_challenges (token_hash,nonce,expires_at) VALUES (?,?,?)').bind(await hashToken(raw),nonce,now+600000)]);
 headers.set('Set-Cookie',authCookie('gr_challenge',raw,secure,600));return Response.json({available:true,clientId,nonce},{headers});
}
