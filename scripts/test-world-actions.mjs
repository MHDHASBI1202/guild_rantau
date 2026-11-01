import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {loadGameModules} from './load-game-modules.mjs';
const {world:w,roles:r,camp,avatar}=await loadGameModules();
assert.equal(r.ROLES.length,6);assert.equal(w.ACTIVITIES.length,8);
const base='http://127.0.0.1:5173';const auth=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});const cookie=auth.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');assert.ok(cookie);
async function get(authenticated=true){const res=await fetch(base+'/api/guild',{headers:authenticated?{cookie}:{}});assert.equal(res.status,200);return res.json();}
async function post(body,status=200){const res=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await res.json();assert.equal(res.status,status,JSON.stringify(d));return d;}
let d=await get();if(d.me&&!['Nara Uji','QA Petualang','QA Nama Baru'].includes(d.me.name))throw Error('Refusing non-QA local data');
if(!d.me)d=await post({action:'join',gender:'laki-laki',name:'QA Petualang',role:'Perajin',color:'#e99552'});
const original=d.me,owned=structuredClone(d.me.wardrobe);
async function ready(){await writeFile('outputs/world-cooldown-qa.sql',"UPDATE members SET last_action=0 WHERE id='local_seedy' AND name IN ('QA Petualang','Nara Uji','QA Nama Baru'); UPDATE world_events SET created_at=0 WHERE member_id='local_seedy';");const p=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','outputs/world-cooldown-qa.sql'],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);}
const update=role=>({action:'update',name:original.name,color:original.color,gender:original.gender??'laki-laki',role});
for(const role of r.ROLES){d=await post(update(role));assert.equal(d.me.role,role);assert.equal(d.me.bed,original.bed);assert.deepEqual(d.me.wardrobe,owned);}
await post(update('Admin'),400);
for(const a of w.ACTIVITIES){
 const role=r.ROLE_OPTIONS.find(r=>r.specialty===a.id)?.name??'Penjaga';await post(update(role));await ready();const before=await get(),reward=w.activityReward(a.id,role),id=crypto.randomUUID();
 d=await post({action:a.id,requestId:id,amount:999,xp:999});assert.equal(d.me.xp,before.me.xp+reward.xp);assert.deepEqual(d.me.wardrobe,owned);
 for(const impact of w.IMPACTS)assert.equal(d.world[impact.key],before.world[impact.key]+(impact.key===a.impact?reward.amount:0));
 assert.equal(d.impact.amount,reward.amount);const saved=await get();assert.deepEqual(saved.world,d.world);
 const replay=await post({action:a.id,requestId:id});assert.equal(replay.me.xp,d.me.xp);assert.deepEqual(replay.world,d.world);
 await post({action:a.id,requestId:crypto.randomUUID()},429);assert.deepEqual((await get()).world,d.world);
 const group=camp.createCampEnvironment(d.world);assert.ok(group.getObjectByName('camp-'+a.impact).children.length>0);avatar.disposeAvatar(group);
}
await ready();const before=await get(),id=crypto.randomUUID();const concurrent=await Promise.all([post({action:'wood',requestId:id}),post({action:'wood',requestId:id})]);d=await get();assert.equal(d.world.wood,before.world.wood+1);assert.equal(d.me.xp,before.me.xp+12);assert.ok(concurrent.every(x=>x.me));
await ready();const parallelBefore=await get();const statuses=await Promise.all([0,1].map(async()=>{const response=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'wood',requestId:crypto.randomUUID()})});return response.status;}));assert.deepEqual(statuses.sort(),[200,429]);d=await get();assert.equal(d.world.wood,parallelBefore.world.wood+1);
await post({action:'reset',confirmation:'MULAI ULANG'});await post({action:'wood'},429);assert.deepEqual((await get()).world,d.world,'Reset must preserve shared progress and cannot bypass shared cooldown');
const anonymous=await get(false);assert.equal(anonymous.me,null);assert.deepEqual(anonymous.world,d.world);assert.ok(anonymous.worldEvents.every(e=>!('memberId' in e)&&!('name' in e)&&!('attemptId' in e)));
const max=Object.fromEntries(Object.keys(w.EMPTY_WORLD).map(k=>[k,1000000]));const big=camp.createCampEnvironment(max);let meshes=0;big.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes<200,'Visual object count stays bounded');avatar.disposeAvatar(big);
console.log('PASS: six role updates; eight persisted personal/shared/3D effects; server-owned rewards; cooldown; same-ID concurrency/replay; reset cannot farm; anonymous shared progress; bounded scene (LOCAL QA).');
