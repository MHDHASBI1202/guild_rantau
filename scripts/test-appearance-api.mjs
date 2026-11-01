import assert from 'node:assert/strict';
import {loadGameModules} from './load-game-modules.mjs';
const {appearance:l}=await loadGameModules();
assert.equal(l.HAIR_STYLES.length,10);assert.equal(l.SKIN_TONES.length,6);
const base='http://127.0.0.1:5173';
const auth=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'}),cookie=auth.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
assert.ok(cookie);
async function get(){const r=await fetch(base+'/api/guild',{headers:{cookie}});assert.equal(r.status,200);return r.json();}
async function post(body,status=200){const r=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
let data=await get();if(data.me&&!['Nara Uji','QA Petualang','QA Nama Baru'].includes(data.me.name))throw Error('Refusing non-QA local data');
if(!data.me)data=await post({action:'join',gender:'perempuan',name:'QA Petualang',role:'Penjelajah',color:'#e99552',hairStyle:'bob',skinTone:'#b57b52'});
const original=data.me, fields=['xp','wood','herbs','tickets','spinsUsed','highestLevel','wardrobe','bed'];
const update={action:'update',name:original.name,role:original.role,color:original.color,gender:original.gender??'perempuan'};
for(const h of l.HAIR_STYLES)for(const s of l.SKIN_TONES){
 data=await post({...update,hairStyle:h.id,skinTone:s.color});
 for(const key of fields)assert.deepEqual(data.me[key],original[key]);
 const persisted=(await get()).me;assert.equal(persisted.hairStyle,h.id);assert.equal(persisted.skinTone,s.color);
 const publicMember=data.members.find(m=>m.bed===original.bed);assert.equal(publicMember.hairStyle,h.id);assert.equal(publicMember.skinTone,s.color);
}
for(const gender of ['laki-laki','perempuan']){data=await post({...update,gender});assert.equal(data.me.hairStyle,'gundul');assert.equal(data.me.skinTone,l.SKIN_TONES.at(-1).color);}
await post({...update,hairStyle:'premium'},400);await post({...update,skinTone:'#ffffff'},400);
await post({...update,hairStyle:{bad:1}},400);await post({...update,skinTone:42},400);
await post({...update,hairStyle:'bob',skinTone:'#b57b52',gender:'perempuan'});
console.log('PASS: 60 free combinations persist privately/publicly, invalid values rejected, gender independent, no XP/ticket/collection changes (local QA only).');
