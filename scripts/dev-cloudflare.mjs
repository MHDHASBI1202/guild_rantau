import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['scripts/run-framework.mjs','dev','--port','5174'],{stdio:'inherit',env:{...process.env,GUILD_DEPLOY:'cloudflare'}});if(r.error)throw r.error;process.exit(r.status??1);
