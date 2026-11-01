import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{stdio:'inherit',env:{...process.env,GUILD_DEPLOY:'cloudflare'}});if(r.error)throw r.error;process.exit(r.status??1);
