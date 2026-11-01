import {env} from 'cloudflare:workers';
import {authCookie,cookieValue,hashToken,randomToken,readAuthJson,verifyGoogleCredential} from '../../../auth-core';
export async function POST(request:Request){
 const headers=new Headers({'Cache-Control':'no-store'}),origin=new URL(request.url).origin;
 if(request.headers.get('origin')!==origin)return Response.json({error:'Asal permintaan tidak valid.'},{status:403,headers});
 if(!env.DB||!env.GOOGLE_CLIENT_ID)return Response.json({error:'Login Google belum dikonfigurasi.'},{status:503,headers});
 let credential:unknown;try{credential=(await readAuthJson(request) as {credential:unknown}).credential;}catch{return Response.json({error:'Permintaan tidak valid.'},{status:400,headers});}
 if(typeof credential!=='string'||credential.length>12000)return Response.json({error:'Token masuk tidak valid.'},{status:400,headers});
 const secure=new URL(request.url).protocol==='https:',challenge=cookieValue(request.headers.get('cookie'),(secure?'__Host-':'')+'gr_challenge');
 if(!challenge||!/^[a-f0-9]{64}$/.test(challenge))return Response.json({error:'Sesi masuk berakhir. Muat ulang halaman.'},{status:401,headers});
 const hash=await hashToken(challenge),now=Date.now(),row=await env.DB.prepare('SELECT nonce FROM auth_challenges WHERE token_hash=? AND expires_at>?').bind(hash,now).first<{nonce:string}>();
 if(!row)return Response.json({error:'Sesi masuk berakhir. Muat ulang halaman.'},{status:401,headers});
 let identity;try{identity=await verifyGoogleCredential(credential,env.GOOGLE_CLIENT_ID,row.nonce);}catch{return Response.json({error:'Identitas Google tidak dapat diverifikasi. Silakan masuk lagi.'},{status:401,headers});}
 const session=randomToken(),expires=now+30*86400000;
 const result=await env.DB.batch([
  env.DB.prepare('INSERT INTO auth_sessions (token_hash,user_id,email,name,expires_at,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM auth_challenges WHERE token_hash=? AND nonce=? AND expires_at>?)').bind(await hashToken(session),identity.userId,identity.email,identity.name,expires,now,hash,row.nonce,now),
  env.DB.prepare('DELETE FROM auth_challenges WHERE token_hash=? AND nonce=?').bind(hash,row.nonce),
 ]);
 if(!result[0].meta.changes)return Response.json({error:'Sesi masuk sudah digunakan. Muat ulang halaman.'},{status:409,headers});
 const hasCharacter=!!await env.DB.prepare('SELECT id FROM members WHERE id=?').bind(identity.userId).first();
 headers.append('Set-Cookie',authCookie('gr_session',session,secure,30*86400));headers.append('Set-Cookie',authCookie('gr_challenge','',secure,0));return Response.json({ok:true,hasCharacter},{headers});
}
