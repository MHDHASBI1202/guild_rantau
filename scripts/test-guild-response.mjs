import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile('app/guild-response.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {readGuildResponse}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const data={me:{name:'QA'},members:[]};
assert.deepEqual(await readGuildResponse(Response.json(data)),data);
const conflict={error:'Kamu sudah punya karakter.'};
assert.deepEqual(await readGuildResponse(Response.json(conflict,{status:409})),conflict);
for(const body of ['', '<html>Server error</html>', '{"me":', 'null', '[]']){
 await assert.rejects(readGuildResponse(new Response(body,{status:500})),/Server kamp sedang bermasalah/);
 await assert.rejects(readGuildResponse(new Response(body)),/Respons kamp belum lengkap/);
}
await assert.rejects(readGuildResponse(new Response('',{status:401})),/Sesi masukmu berakhir/);
console.log('PASS: valid guild replies and conflicts preserved; empty, truncated, HTML, null and array responses show readable errors.');
