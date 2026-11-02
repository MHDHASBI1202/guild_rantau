// Uses only the isolated LOCAL database and production build on localhost:5186.
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {loadGameModules} from './load-game-modules.mjs';
const base='http://127.0.0.1:5186',dir='outputs/character-join-regression';
const {roles}=await loadGameModules();
await mkdir(dir,{recursive:true});
const cases=roles.ROLE_OPTIONS.flatMap(role=>role.subroles.map(s=>({role:role.name,subrole:s.name})));
const runId=randomBytes(6).toString('hex');
const sessions=Array.from({length:21},(_,i)=>({id:'google:join-regression-'+runId+'-'+i,token:randomBytes(32).toString('hex')}));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
async function sql(statement){
 const file=dir+'/fixture.sql';await writeFile(file,statement);
 const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.jsonc','--persist-to',dir+'/state','--file',file],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
}
const now=Date.now();
await sql(sessions.map(s=>`INSERT OR REPLACE INTO auth_sessions(token_hash,user_id,email,name,expires_at,created_at) VALUES(${quote(createHash('sha256').update(s.token).digest('hex'))},${quote(s.id)},'qa@example.test','QA',${now+3600000},${now});`).join('\n')+`\nINSERT INTO members(id,name,role,color,gender,joined_at,bed,xp,wood,herbs,highest_level,cosmetics) VALUES(${quote(sessions[18].id)},'QA Existing','Penjelajah','#e99552','perempuan',${now},'QA-LEGACY',125,17,9,2,'{"owned":["topi:baret"],"equipped":{"topi":"baret"}}');`);
async function call(path,{index=0,method='GET',body,raw,authenticated=true,origin=base}={}){
 const headers={...(authenticated?{cookie:'__Host-gr_session='+sessions[index].token}:{}),origin,connection:'close','Content-Type':'application/json'};
 const response=await fetch(base+path,{method,headers,...(method==='POST'?{body:raw??JSON.stringify(body)}:{})});
 const text=await response.text();let data;
 try{data=JSON.parse(text);}catch{assert.fail(`HTTP ${response.status} returned invalid JSON: ${text.slice(0,100)}`);}
 assert.match(response.headers.get('content-type'),/application\/json/);
 return {status:response.status,data};
}
const original=(await call('/api/guild',{index:18})).data.me;
assert.equal(original.xp,125);assert.equal(original.outfit.topi,'baret');
const body=(role,subrole)=>({action:'join',name:'QA New Adventurer',role,subrole,gender:'perempuan',color:'#e99552',hairStyle:'panjang',skinTone:'#b57b52'});



for(const [i,item] of cases.entries()){
 const result=await call('/api/guild',{index:i,method:'POST',body:body(item.role,item.subrole)});
 assert.equal(result.status,200,JSON.stringify(result.data));
 const me=result.data.me;
 assert.equal(me.role,item.role);assert.equal(me.subrole,item.subrole);assert.equal(me.wardrobe.subrole,item.subrole);
 assert.equal(me.wardrobe.owned.length,10);assert.equal(me.xp,0);assert.equal(me.tickets,0);
 assert.equal((await call('/api/guild',{index:i})).data.me.subrole,item.subrole);
 assert.equal((await call('/api/guild',{index:i,method:'POST',body:body(item.role,item.subrole)})).status,409);
}
for(const index of [19,20]){
 const result=await call('/api/guild',{index,method:'POST',body:body('Penjelajah',index===19?undefined:'Invalid specialization')});
 assert.equal(result.status,200);assert.equal(result.data.me.subrole,roles.defaultSubrole('Penjelajah'));
}
assert.deepEqual((await call('/api/guild',{index:18})).data.me,original,'Existing XP, resources and wardrobe must stay unchanged');
assert.equal((await call('/api/guild',{method:'POST',raw:'{'})).status,400);
assert.equal((await call('/api/guild',{method:'POST',authenticated:false})).status,401);
assert.equal((await call('/api/guild',{method:'POST',origin:'https://invalid.example'})).status,403);
// Simulate a database failure only in this disposable local fixture, then restore it.
await sql('ALTER TABLE camp_state RENAME TO camp_state_unavailable;');
try{
 const result=await call('/api/guild');assert.equal(result.status,500);
 assert.equal(result.data.error,'Server kamp sedang bermasalah. Silakan coba lagi sebentar.');
}finally{await sql('ALTER TABLE camp_state_unavailable RENAME TO camp_state;');}
assert.equal((await call('/api/guild')).status,200);
const report={build:'production worker served locally',database:'isolated local fixture only',subrolesJoined:cases.length,defaultAndInvalidSubroleFallback:true,existingProgressPreserved:true,duplicateJoin:409,missingSession:401,malformedRequest:400,foreignOrigin:403,serverFailureReturnsJson:500};
await writeFile(dir+'/verification.json',JSON.stringify(report,null,2));
console.log('PASS',JSON.stringify(report));
