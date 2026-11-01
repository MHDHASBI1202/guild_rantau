import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export function randomToken(){const b=crypto.getRandomValues(new Uint8Array(32));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');}
export async function hashToken(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
export function cookieValue(header:string|null,name:string){return header?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)??null;}
export function authCookie(name:string,value:string,secure:boolean,maxAge:number){return `${secure?'__Host-':''}${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function safeReturn(value:string|null){if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/';try{const u=new URL(value,'https://guild.invalid');return u.origin==='https://guild.invalid'?u.pathname+u.search+u.hash:'/';}catch{return '/';}}
export async function readAuthJson(request:Request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('Expected JSON');
 const reader=request.body?.getReader();if(!reader)throw Error('Missing body');const chunks:Uint8Array[]=[];let length=0;
 while(true){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>16384){await reader.cancel();throw Error('Body too large');}chunks.push(next.value);}
 const body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}return JSON.parse(new TextDecoder().decode(body)) as unknown;
}
export async function verifyGoogleCredential(token:string,clientId:string,nonce:string,keys:JWTVerifyGetKey=googleKeys){
 const {payload}=await jwtVerify(token,keys,{issuer:['accounts.google.com','https://accounts.google.com'],audience:clientId,algorithms:['RS256'],maxTokenAge:'10m',clockTolerance:5});
 if(payload.nonce!==nonce||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||typeof payload.email!=='string'||payload.email_verified!==true||(payload.azp!==undefined&&payload.azp!==clientId))throw Error('Invalid Google identity');
 return {userId:'google:'+payload.sub,email:payload.email,name:typeof payload.name==='string'?payload.name.slice(0,100):null};
}
