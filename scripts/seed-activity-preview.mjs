// Disposable localhost QA fixtures. Never run against a hosted database.
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {loadGameModules} from './load-game-modules.mjs';
const {world,roles}=await loadGameModules(),now=Date.now();
let sql=world.ACTIVITIES.map((a,i)=>{const role=roles.ROLE_OPTIONS.find(r=>r.specialty===a.id)?.name??'Penjaga';return `INSERT INTO members (id,name,role,color,gender,hair_style,skin_tone,activity,last_action,joined_at,bed) VALUES ('qa_activity_${a.id}','QA ${a.title}','${role}','#8baf9c','perempuan','panjang','#b57b52','${a.activity}',${now},${i+1},'QA-${a.id}') ON CONFLICT(id) DO UPDATE SET activity=excluded.activity,last_action=excluded.last_action;`;}).join('\n');
if(process.argv.includes('--clear'))sql=world.ACTIVITIES.map(a=>`DELETE FROM members WHERE id='qa_activity_${a.id}' AND bed='QA-${a.id}';`).join('\n');
await writeFile('outputs/activity-preview-qa.sql',sql);
const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','outputs/activity-preview-qa.sql'],{encoding:'utf8'});if(r.status)throw Error(r.stderr);console.log(process.argv.includes('--clear')?'Local QA fixtures cleared.':'Eight local QA activity fixtures refreshed.');
