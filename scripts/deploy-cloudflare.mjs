import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
if(!config.d1_databases?.[0]?.database_id||config.d1_databases[0].database_id==='00000000-0000-4000-8000-000000000000')throw Error('Database produksi belum disiapkan. Buat D1 guild-rantau-db dan isi database_id di wrangler.jsonc.');
if(!/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(config.vars?.GOOGLE_CLIENT_ID??''))throw Error('Isi GOOGLE_CLIENT_ID publik di vars wrangler.jsonc sebelum deploy.');
const run=args=>{const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status)process.exit(r.status);};
run(['scripts/build-cloudflare.mjs']);
run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--remote','--config','wrangler.jsonc']);
run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json']);
