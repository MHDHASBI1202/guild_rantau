import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source=await fs.readFile('worker/index.ts','utf8');
for(const dev of [false,true]){
 let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/import handler from [^;]+;/,'const handler={fetch:()=>new Response("handler")};').replace(/import \{ runWithConnectorBinding \} from [^;]+;/,'const runWithConnectorBinding=(binding,fn)=>fn();').replaceAll('import.meta.env.DEV',String(dev));
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
 for(const path of ['/signin','/login','/sign-in','/signin%20with%20chatgpt']){const response=worker.fetch(new Request('https://guild.test'+path+'?return_to=%2Fkarakter'),{},{});assert.equal(response.status,302);assert.equal(new URL(response.headers.get('location')).pathname,'/masuk');assert.equal(new URL(response.headers.get('location')).searchParams.get('return_to'),'/karakter');}
 for(const path of ['/signin-extra','/login-unrelated','/masuk','/api/auth/google','/%E0'])assert.equal(worker.fetch(new Request('https://guild.test'+path),{},{}).status,200,'Only explicit aliases redirect');
 assert.equal(worker.fetch(new Request('https://guild.test/signin-with-chatgpt'),{},{}).status,dev?200:302,'Preserve local mock login');
}
console.log('PASS: explicit legacy aliases, return path preservation, unknown paths unaffected, malformed URLs and local mock sign-in.');
