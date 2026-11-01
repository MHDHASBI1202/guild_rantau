// Destructive QA is restricted to the disposable local_seedy preview character.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {loadGameModules} from './load-game-modules.mjs';
const {cosmetics:c}=await loadGameModules();const base='http://127.0.0.1:5173';
const auth=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});const cookie=auth.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');assert.ok(cookie);
const get=async()=>{const r=await fetch(base+'/api/guild',{headers:{cookie}});assert.equal(r.status,200);return r.json();};
const post=async(body,status=200)=>{const r=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;};
let d=await get();if(d.me&&!['Nara Uji','QA Petualang','QA Nama Baru'].includes(d.me.name))throw Error('Refusing to modify non-QA local data');
if(!d.me)d=await post({action:'join',gender:'laki-laki',name:'QA Petualang',role:'Penjelajah',color:'#e99552'});
async function seed(sql){await mkdir('outputs',{recursive:true});await writeFile('outputs/wardrobe-qa.sql',sql);const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','outputs/wardrobe-qa.sql'],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);}
const where="id='local_seedy' AND name IN ('Nara Uji','QA Petualang','QA Nama Baru')";
await seed(`DELETE FROM spin_history WHERE member_id='local_seedy'; UPDATE members SET xp=95,highest_level=1,spins_used=0,cosmetics='{}',last_action=0 WHERE ${where};`);
d=await get();assert.equal(d.me.xp,95);assert.equal(d.me.tickets,0);assert.equal(d.me.wardrobe.owned.length,10);
await post({action:'spin',requestId:crypto.randomUUID()},409);
await post({action:'equip',slot:'topi',itemId:'mahkota'},403);
d=await post({action:'guard'});assert.equal(d.me.xp,110);assert.equal(d.me.tickets,1);assert.equal(d.me.highestLevel,2);
const sameId=crypto.randomUUID();const pair=await Promise.all([post({action:'spin',requestId:sameId}),post({action:'spin',requestId:sameId})]);assert.equal(pair[0].reward,pair[1].reward);
d=await get();assert.equal(d.me.spinsUsed,1);assert.equal(d.me.tickets,0);assert.equal(d.me.wardrobe.owned.length,11);assert.equal(d.me.recentSpins.length,1);
const won=c.ITEMS.find(i=>c.itemKey(i)===pair[0].reward);assert.ok(won);
d=await post({action:'equip',slot:won.slot,itemId:won.id});assert.equal(d.me.outfit[won.slot],won.id);assert.equal(d.members.find(m=>m.bed===d.me.bed).outfit[won.slot],won.id);
assert.ok(!('wardrobe' in d.members[0]),'Private collection must not leak in public member list');
await post({action:'spin',requestId:crypto.randomUUID()},409);
await post({action:'spin',requestId:'bad'},400);
d=await post({action:'spin',requestId:sameId});assert.equal(d.me.spinsUsed,1);assert.equal(d.reward,c.itemKey(won));
d=await post({action:'reset',confirmation:'MULAI ULANG'});assert.equal(d.me.xp,0);assert.equal(d.me.tickets,0);assert.equal(d.me.highestLevel,2);assert.equal(d.me.wardrobe.owned.length,11);assert.equal(d.me.outfit[won.slot],won.id);
await seed(`UPDATE members SET xp=95,last_action=0 WHERE ${where};`);d=await post({action:'guard'});assert.equal(d.me.tickets,0,'Reset must not farm level tickets');
await seed(`UPDATE members SET xp=195,last_action=0 WHERE ${where};`);d=await post({action:'guard'});assert.equal(d.me.tickets,1);assert.equal(d.me.highestLevel,3);
const requests=[crypto.randomUUID(),crypto.randomUUID()];const results=await Promise.all(requests.map(async requestId=>{const r=await fetch(base+'/api/guild',{method:'POST',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'spin',requestId})});return {status:r.status,data:await r.json()};}));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
d=await get();assert.equal(d.me.tickets,0);assert.equal(d.me.spinsUsed,2);assert.equal(d.me.wardrobe.owned.length,12);
await seed(`UPDATE members SET xp=500 WHERE ${where};`);d=await get();assert.equal(d.me.tickets,3,'Older XP milestones should receive tickets');
for(let i=0;i<3;i++)await post({action:'spin',requestId:crypto.randomUUID()});d=await get();assert.equal(d.me.spinsUsed,5);assert.equal(new Set(d.me.wardrobe.owned).size,15);
const complete=JSON.stringify({owned:c.ITEMS.map(c.itemKey),equipped:d.me.outfit}).replaceAll("'","''");await seed(`UPDATE members SET cosmetics='${complete}',xp=700,highest_level=8 WHERE ${where};`);d=await get();const before=d.me.tickets;await post({action:'spin',requestId:crypto.randomUUID()},409);assert.equal((await get()).me.tickets,before);
await post({action:'delete',confirmation:'HAPUS',characterName:d.me.name});d=await post({action:'join',gender:'laki-laki',name:'QA Petualang',role:'Penjelajah',color:'#e99552'});assert.equal(d.me.wardrobe.owned.length,10);assert.equal(d.me.recentSpins.length,0);assert.equal(d.me.tickets,0);
// Leave a documented local-only demo with three earned tickets for UI QA.
await seed(`UPDATE members SET xp=300,highest_level=4,last_action=0 WHERE ${where};`);
console.log('PASS: level rewards, locked equip, same-request retries, concurrent spins, negative-balance prevention, persistence, no duplicates, retroactive tickets, reset anti-farming, complete collection, and deletion cascade. QA demo only: level 4 / 3 tickets.');
