import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
await mkdir('outputs/auth-tests',{recursive:true});const source=await readFile('app/auth-core.ts','utf8');await writeFile('outputs/auth-tests/core.mjs',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const core=await import('../outputs/auth-tests/core.mjs'),client='123456789-test.apps.googleusercontent.com',nonce='test-nonce';
const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='qa-key';const keys=createLocalJWKSet({keys:[jwk]});
async function token(overrides={},opts={}){return new SignJWT({sub:'qa-user',email:'qa@example.test',email_verified:true,name:'QA',nonce,...overrides}).setProtectedHeader({alg:'RS256',kid:'qa-key'}).setIssuer(opts.issuer??'https://accounts.google.com').setAudience(opts.audience??client).setIssuedAt().setExpirationTime(opts.expires??'5m').sign(privateKey);}
const valid=await token(),identity=await core.verifyGoogleCredential(valid,client,nonce,keys);assert.equal(identity.userId,'google:qa-user');assert.equal(identity.email,'qa@example.test');
for(const bad of [await token({nonce:'other'}),await token({email_verified:false}),await token({sub:''}),await token({email:null}),await token({}, {audience:'other-client'}),await token({}, {issuer:'https://evil.example'}),await token({}, {expires:-10})])await assert.rejects(core.verifyGoogleCredential(bad,client,nonce,keys));
const tampered=valid.slice(0,-10)+'AAAAAAAAAA';await assert.rejects(core.verifyGoogleCredential(tampered,client,nonce,keys));
assert.equal(core.safeReturn('//evil.example'),'/');assert.equal(core.safeReturn('/\\evil.example'),'/');assert.equal(core.safeReturn('/karakter?x=1'),'/karakter?x=1');
const secure=core.authCookie('gr_session','abc',true,60);for(const flag of ['__Host-','HttpOnly','SameSite=Lax','Secure','Path=/'])assert.ok(secure.includes(flag));
const random=core.randomToken();assert.match(random,/^[a-f0-9]{64}$/);assert.notEqual(await core.hashToken(random),random);assert.equal(core.cookieValue('one=1; gr_session=xyz; two=2','gr_session'),'xyz');
console.log('PASS: Google signature/audience/issuer/expiry/nonce/email checks, tampering rejection, secure cookie, random/hash token and safe return path (local signing key; no live Google account used).');
