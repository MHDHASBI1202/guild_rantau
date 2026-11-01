import {authCookie} from '../../auth-core';
import {ROLES as roles} from '../../role-options';
import {EMPTY_WORLD,IMPACTS,activityReward,type WorldProgress} from '../../world-progress';
import {validHair,validSkin,DEFAULT_HAIR,DEFAULT_SKIN} from '../../appearance-options';
import {GENDERS,normalizeGender,type Gender} from '../../character-options';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {SLOTS,findItem,itemKey,parseCosmetics,drawItem,ticketsFor,starterWardrobe,type Slot} from '../../cosmetics';
const colors=['#e99552','#8baf9c','#8f9fc8','#c68cab'];
type Stored={name:string;role:string;color:string;gender:string;hairStyle:string;skinTone:string;xp:number;wood:number;herbs:number;lastAction:number;activity:string;joinedAt:number;bed:string;cosmetics:string;highestLevel:number;spinsUsed:number};
const privateFields='name,role,color,gender,hair_style AS hairStyle,skin_tone AS skinTone,xp,wood,herbs,last_action AS lastAction,activity,joined_at AS joinedAt,bed,cosmetics,highest_level AS highestLevel,spins_used AS spinsUsed';
async function reply(userId:string|null,extra:Record<string,unknown>={}){
 const db=env.DB!;
 const all=await db.prepare('SELECT name,role,color,gender,hair_style AS hairStyle,skin_tone AS skinTone,xp,activity,last_action AS lastAction,joined_at AS joinedAt,bed,cosmetics FROM members ORDER BY joined_at ASC LIMIT 100').all();
 const count=await db.prepare('SELECT COUNT(*) AS total FROM members').first<{total:number}>();
 const row=userId?await db.prepare(`SELECT ${privateFields} FROM members WHERE id=?`).bind(userId).first<Stored>():null;
 let me=null;
 if(row){const {cosmetics,...rest}=row;const wardrobe=parseCosmetics(cosmetics);const recent=await db.prepare('SELECT id,item_id AS itemKey,created_at AS createdAt FROM spin_history WHERE member_id=? ORDER BY created_at DESC,id DESC LIMIT 10').bind(userId).all();me={...rest,gender:normalizeGender(row.gender),highestLevel:Math.max(row.highestLevel,1+Math.floor(row.xp/100)),wardrobe,outfit:wardrobe.equipped,tickets:ticketsFor(row.xp,row.highestLevel,row.spinsUsed),recentSpins:recent.results};}
 const members=all.results.map(({cosmetics,...member})=>({...member,gender:normalizeGender(member.gender),outfit:parseCosmetics(cosmetics).equipped}));
 const world=await db.prepare('SELECT wood,herbs,defense,comfort,exploration,craft,farm,magic,updated_at AS updatedAt FROM camp_state WHERE id=1').first<WorldProgress>()??EMPTY_WORLD;
 const events=await db.prepare('SELECT id,action,role,amount,created_at AS createdAt FROM world_events ORDER BY created_at DESC,id DESC LIMIT 8').all();
 return Response.json({signedIn:!!userId,me,members,total:count?.total??0,world,worldEvents:events.results,...extra},{headers:{'Cache-Control':'no-store'}});
}
export async function GET(){const user=await getChatGPTUser();return reply(user?.userId??null);}
const fail=(error:string,status=400)=>Response.json({error},{status});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Asal permintaan tidak valid.',403);
 const user=await getChatGPTUser();if(!user)return fail('Masuk dulu untuk menyimpan karaktermu.',401);
 const db=env.DB!;let body:Record<string,string>;
 try{body=await request.json() as Record<string,string>;if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return fail('Permintaan tidak valid.');}
 if(typeof body.action!=='string')return fail('Aksi tidak valid.');
 if(body.action==='join'){
  const name=typeof body.name==='string'?body.name.trim():'';
  const hairStyle=body.hairStyle??DEFAULT_HAIR,skinTone=body.skinTone??DEFAULT_SKIN;if(!validHair(hairStyle)||!validSkin(skinTone))return fail('Pilihan rambut atau warna kulit tidak valid.');
  const gender=body.gender;if(!GENDERS.includes(gender as Gender))return fail('Pilih gender karakter: Laki-laki atau Perempuan.');
  if(name.length<2||name.length>24||!roles.includes(body.role)||!colors.includes(body.color))return fail('Nama 2–24 karakter, pilih peran dan warna.');
  let cosmetics;try{
   if(body.outfit!==undefined&&(typeof body.outfit!=='string'||body.outfit.length>1000))throw Error('Pilihan pakaian tidak valid.');
   cosmetics=starterWardrobe(body.outfit===undefined?undefined:JSON.parse(body.outfit));
  }catch(e){return fail(e instanceof Error?e.message:'Pilihan pakaian tidak valid.');}
  if(await db.prepare('SELECT id FROM members WHERE id=?').bind(user.userId).first())return fail('Kamu sudah punya karakter.',409);
  await db.prepare('INSERT OR IGNORE INTO members (id,name,role,color,gender,hair_style,skin_tone,cosmetics,joined_at,bed) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(user.userId,name,body.role,body.color,gender,hairStyle,skinTone,JSON.stringify(cosmetics),Date.now(),'R-'+crypto.randomUUID().slice(0,8).toUpperCase()).run();
  return reply(user.userId);
 }
 const member=await db.prepare(`SELECT ${privateFields} FROM members WHERE id=?`).bind(user.userId).first<Stored>();
 if(!member)return fail('Karakter tidak ditemukan. Buat karakter dahulu.',404);
 if(body.action==='equip'){
  if(!SLOTS.includes(body.slot as Slot))return fail('Slot tidak dikenal.');
  const item=findItem(body.slot as Slot,body.itemId);const wardrobe=parseCosmetics(member.cosmetics);
  if(!item||!wardrobe.owned.includes(itemKey(item)))return fail('Item ini masih terkunci.',403);
  wardrobe.equipped[item.slot]=item.id;
  const r=await db.prepare('UPDATE members SET cosmetics=? WHERE id=? AND cosmetics=?').bind(JSON.stringify(wardrobe),user.userId,member.cosmetics).run();
  if(!r.meta.changes)return fail('Lemari berubah di perangkat lain. Muat ulang dan coba lagi.',409);
  return reply(user.userId);
 }
 if(body.action==='spin'){
  if(typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId))return fail('ID spin tidak valid.');
  const receipt=()=>db.prepare('SELECT item_id AS itemKey FROM spin_history WHERE id=? AND member_id=?').bind(body.requestId,user.userId).first<{itemKey:string}>();
  const prior=await receipt();if(prior)return reply(user.userId,{reward:prior.itemKey,spinId:body.requestId});
  if(ticketsFor(member.xp,member.highestLevel,member.spinsUsed)<1)return fail('Belum ada tiket. Naik satu level untuk mendapat satu tiket spin.',409);
  const wardrobe=parseCosmetics(member.cosmetics);const item=drawItem(wardrobe.owned);if(!item)return fail('Koleksimu sudah lengkap. Tiketmu tetap tersimpan.',409);
  wardrobe.owned.push(itemKey(item));const attempt=crypto.randomUUID(),now=Date.now();
  // Atomic receipt + update; attempt marker makes concurrent retries idempotent.
  await db.batch([
   db.prepare('INSERT INTO spin_history (id,member_id,item_id,attempt_id,created_at) SELECT ?,?,?,?,? FROM members WHERE id=? AND cosmetics=? AND spins_used=? AND MAX(highest_level,1+CAST(xp/100 AS INTEGER))-1-spins_used>0 AND NOT EXISTS (SELECT 1 FROM spin_history WHERE id=?)').bind(body.requestId,user.userId,itemKey(item),attempt,now,user.userId,member.cosmetics,member.spinsUsed,body.requestId),
   db.prepare('UPDATE members SET cosmetics=?,spins_used=spins_used+1,highest_level=MAX(highest_level,1+CAST(xp/100 AS INTEGER)) WHERE id=? AND cosmetics=? AND spins_used=? AND EXISTS (SELECT 1 FROM spin_history WHERE id=? AND member_id=? AND attempt_id=?)').bind(JSON.stringify(wardrobe),user.userId,member.cosmetics,member.spinsUsed,body.requestId,user.userId,attempt),
  ]);
  const result=await receipt();if(!result)return fail('Lemari berubah saat spin. Tiket tidak terpotong. Coba lagi.',409);
  return reply(user.userId,{reward:result.itemKey,spinId:body.requestId});
 }
 if(body.action==='update'){
  const hairStyle=body.hairStyle??member.hairStyle,skinTone=body.skinTone??member.skinTone;if(!validHair(hairStyle)||!validSkin(skinTone))return fail('Pilihan rambut atau warna kulit tidak valid.');
  const gender=body.gender??normalizeGender(member.gender);if(!GENDERS.includes(gender as Gender))return fail('Pilih gender karakter: Laki-laki atau Perempuan.');
  const name=typeof body.name==='string'?body.name.trim():'';
  if(name.length<2||name.length>24||!roles.includes(body.role)||!colors.includes(body.color))return fail('Nama 2–24 karakter, pilih peran dan warna yang tersedia.');
  await db.prepare('UPDATE members SET name=?,role=?,color=?,gender=?,hair_style=?,skin_tone=? WHERE id=?').bind(name,body.role,body.color,gender,hairStyle,skinTone,user.userId).run();
 }else if(body.action==='reroll'){
  if(body.confirmation!=='ACAK ULANG')return fail('Konfirmasi acak ulang diperlukan.');
  const otherRoles=roles.filter(r=>r!==member.role),otherColors=colors.filter(c=>c!==member.color),values=crypto.getRandomValues(new Uint32Array(2));
  await db.prepare('UPDATE members SET role=?,color=? WHERE id=?').bind(otherRoles[values[0]%otherRoles.length],otherColors[values[1]%otherColors.length],user.userId).run();
 }else if(body.action==='reset'){
  if(body.confirmation!=='MULAI ULANG')return fail('Ketik MULAI ULANG untuk mereset progres.');
  await db.prepare("UPDATE members SET highest_level=MAX(highest_level,1+CAST(xp/100 AS INTEGER)),xp=0,wood=0,herbs=0,last_action=0,activity='Memulai perjalanan dari awal' WHERE id=?").bind(user.userId).run();
 }else if(body.action==='delete'){
  if(body.confirmation!=='HAPUS'||body.characterName!==member.name)return fail('Ketik HAPUS dan nama karakter yang sesuai.');
  const result=await db.prepare('DELETE FROM members WHERE id=? AND name=?').bind(user.userId,body.characterName).run();
  if(!result.meta.changes)return fail('Karakter berubah. Muat ulang sebelum mencoba lagi.',409);
  if(env.AUTH_PROVIDER==='google'){await db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(user.userId).run();const response=await reply(null);response.headers.append('Set-Cookie',authCookie('gr_session','',new URL(request.url).protocol==='https:',0));return response;}
 }else{
  const a=activityReward(body.action,member.role);if(!a)return fail('Aktivitas tidak dikenal.');
  const requestId=body.requestId??crypto.randomUUID();if(typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return fail('ID aktivitas tidak valid.');
  const receipt=()=>db.prepare('SELECT action,amount FROM world_events WHERE id=? AND member_id=?').bind(requestId,user.userId).first<{action:string;amount:number}>();
  const prior=await receipt();if(prior){if(prior.action!==body.action)return fail('ID aktivitas sudah digunakan untuk aktivitas lain.',409);return reply(user.userId);}
  const now=Date.now(),attempt=crypto.randomUUID();
  // One transaction: claim cooldown, update personal progress, then apply the shared impact.
  // The impact column comes only from the server-owned activity catalogue.
  await db.batch([
   db.prepare('INSERT OR IGNORE INTO world_events (id,member_id,action,role,amount,attempt_id,created_at) SELECT ?,?,?,?,?,?,? FROM members WHERE id=? AND role=? AND last_action<=? AND NOT EXISTS (SELECT 1 FROM world_events WHERE member_id=? AND created_at>?) AND NOT EXISTS (SELECT 1 FROM world_events WHERE id=?)').bind(requestId,user.userId,body.action,member.role,a.amount,attempt,now,user.userId,member.role,now-60000,user.userId,now-60000,requestId),
   db.prepare('UPDATE members SET activity=?,xp=xp+?,wood=wood+?,herbs=herbs+?,last_action=?,highest_level=MAX(highest_level,1+CAST((xp+?)/100 AS INTEGER)) WHERE id=? AND EXISTS (SELECT 1 FROM world_events WHERE id=? AND attempt_id=?)').bind(a.activity,a.xp,a.wood,a.herbs,now,a.xp,user.userId,requestId,attempt),
   db.prepare(`INSERT INTO camp_state (id,${a.impact},updated_at) SELECT 1,?,? WHERE EXISTS (SELECT 1 FROM world_events WHERE id=? AND attempt_id=?) ON CONFLICT(id) DO UPDATE SET ${a.impact}=camp_state.${a.impact}+excluded.${a.impact},updated_at=excluded.updated_at`).bind(a.amount,now,requestId,attempt),
  ]);
  const result=await receipt();if(!result)return fail('Istirahat sebentar. Aktivitas bisa dilakukan setiap 60 detik.',429);
  const impact=IMPACTS.find(i=>i.key===a.impact)!;
  return reply(user.userId,{impact:{key:a.impact,amount:result.amount,message:`+${result.amount} ${impact.name.toLowerCase()}. ${impact.description}`}});
 }
 return reply(user.userId);
}
