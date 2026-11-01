import {env} from 'cloudflare:workers';
import {authCookie,cookieValue,hashToken} from '../../../auth-core';
export async function POST(request:Request){
 const url=new URL(request.url);if(request.headers.get('origin')!==url.origin)return new Response('Asal permintaan tidak valid.',{status:403});
 const secure=url.protocol==='https:',raw=cookieValue(request.headers.get('cookie'),(secure?'__Host-':'')+'gr_session');if(raw&&env.DB)await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hashToken(raw)).run();
 const headers=new Headers({Location:'/', 'Cache-Control':'no-store','Set-Cookie':authCookie('gr_session','',secure,0)});if(import.meta.env.DEV&&env.AUTH_PROVIDER!=='google')headers.append('Set-Cookie','__sites_local_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
 return new Response(null,{status:303,headers});
}
