import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {cookieValue,hashToken} from './auth-core';
export async function getGoogleSession(){
 const h=await headers();const raw=cookieValue(h.get('cookie'),'__Host-gr_session')??(import.meta.env.DEV?cookieValue(h.get('cookie'),'gr_session'):null);
 if(!raw||!/^[a-f0-9]{64}$/.test(raw)||!env.DB)return null;
 const row=await env.DB.prepare('SELECT user_id AS userId,email,name FROM auth_sessions WHERE token_hash=? AND expires_at>?').bind(await hashToken(raw),Date.now()).first<{userId:string;email:string;name:string|null}>();
 return row?{userId:row.userId,email:row.email,displayName:row.name??row.email,fullName:row.name}:null;
}
