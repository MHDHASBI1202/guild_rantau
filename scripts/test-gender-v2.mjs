import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {loadGameModules} from './load-game-modules.mjs';
const {options}=await loadGameModules();assert.deepEqual(options.GENDERS,['laki-laki','perempuan']);assert.equal(options.normalizeGender('netral'),null);
const base='http://127.0.0.1:5173';const auth=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});const cookie=auth.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookie);
async function get(){const r=await fetch(base+'/api/guild',{headers:{cookie}});assert.equal(r.status,200);return r.json();}
async function post(body,status=200){const r=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
let d=await get();if(d.me&&!['Nara Uji','QA Petualang','QA Nama Baru'].includes(d.me.name))throw Error('Refusing to change non-QA local data');
if(!d.me)d=await post({action:'join',gender:'laki-laki',name:'QA Petualang',role:'Penjelajah',color:'#e99552'});
const original={...d.me};
await mkdir('outputs',{recursive:true});await writeFile('outputs/legacy-gender-qa.sql',"UPDATE members SET gender='netral' WHERE id='local_seedy' AND name IN ('Nara Uji','QA Petualang','QA Nama Baru');");
const seed=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','outputs/legacy-gender-qa.sql'],{encoding:'utf8'});assert.equal(seed.status,0,seed.stderr);
d=await get();assert.equal(d.me.gender,null);assert.equal(d.members.find(m=>m.bed===original.bed).gender,null);
await post({action:'update',name:original.name,role:original.role,color:original.color},400);
for(const gender of ['laki-laki','perempuan']){d=await post({action:'update',name:original.name,role:original.role,color:original.color,gender});assert.equal(d.me.gender,gender);assert.equal(d.members.find(m=>m.bed===original.bed).gender,gender);assert.equal(d.me.xp,original.xp);assert.equal(d.me.tickets,original.tickets);assert.deepEqual(d.me.wardrobe,original.wardrobe);assert.equal((await get()).me.gender,gender);}
await post({action:'update',name:original.name,role:original.role,color:original.color,gender:'netral'},400);
await post({action:'join',name:'QA Petualang',role:'Penjelajah',color:'#e99552'},400);
await post({action:'join',gender:'netral',name:'QA Petualang',role:'Penjelajah',color:'#e99552'},400);
d=await post({action:'update',name:original.name,role:original.role,color:original.color});assert.equal(d.me.gender,'perempuan','Valid stored choice survives an older update request');
console.log('PASS: exactly two genders, legacy data maps to unselected, explicit choice required, rejected neutral/missing choices, persistence and unchanged XP/tickets/cosmetics (local QA only).');
