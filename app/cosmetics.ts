import {getMemberLevel} from './milestones';

export const SLOTS=['baju','topi','celana','aksesori','perlengkapan'] as const;
export type Slot=typeof SLOTS[number];
export type Rarity='awal'|'unik'|'langka'|'legendaris';
export type Item={id:string;name:string;slot:Slot;rarity:Rarity;color:string;detail:string;barter?:{wood:number;herbs:number}};
export type Loadout=Record<Slot,string>;
const group=(slot:Slot,rows:[string,string,Rarity,string,string,({wood:number;herbs:number}|undefined)?][]):Item[]=>rows.map(([id,name,rarity,color,detail,barter])=>({id,name,rarity,color,detail,slot,...(barter?{barter}:{})}));
export const ITEMS:Item[]=[
 ...group('baju',[
 ['linen','Tunik Linen','awal','#e9e2cb','Bekal sederhana dari hari pertama.'],['lumut','Tunik Lumut','awal','#85977a','Warna tenang untuk perjalanan jauh.'],
 ['senja','Mantel Senja','unik','#ba7355','Lapisan hangat dengan kerah tinggi.'],['samudra','Tunik Samudra','unik','#589491','Aksen biru kehijauan dari pesisir.'],
 ['rompi_pengrajin','Rompi Rimba','unik','#5a6b4e','Rompi berbahan kulit kayu dan serat alami.',{wood:18,herbs:12}],
 ['zirah','Zirah Perak','langka','#b6c9ce','Pelindung dada dan bahu berkilau.'],['surya','Jubah Sang Surya','legendaris','#e5bd69','Tunik emas dengan lambang matahari.']]),
 ...group('topi',[
 ['peran','Penutup Kepala Peran','awal','#8a9d84','Helm, tudung, atau topi sesuai peran.'],['terbuka','Tanpa Topi','awal','#a99a80','Rambut bebas diterpa angin.'],
 ['baret','Baret Pengelana','unik','#9a6380','Baret plum dengan kancing emas.'],['jerami','Topi Jerami','unik','#cdb376','Pelindung dari matahari perjalanan.'],
 ['caping','Caping Bambu','langka','#cdb376','Anyaman bambu pelindung terik di belantara.',{wood:16,herbs:12}],
 ['kristal','Mahkota Kristal','langka','#7bc7cc','Tiga kristal biru di lingkar kepala.'],['mahkota','Mahkota Fajar','legendaris','#e5bd69','Mahkota emas bertatah batu amber.']]),
 ...group('celana',[
 ['arang','Celana Arang','awal','#414d4b','Celana kuat untuk hari pertama.'],['khaki','Celana Khaki','awal','#a79471','Kain ringan berwarna tanah.'],
 ['rimba','Celana Rimba','unik','#57755c','Hijau tua dengan kantong perjalanan.'],['bahari','Celana Bahari','unik','#597f9e','Biru laut dengan manset terang.'],
 ['ksatria','Celana Ksatria','langka','#879ba7','Pelindung lutut perak.'],['astral','Celana Astral','legendaris','#777bb0','Indigo dengan pelindung kaki emas.']]),
 ...group('aksesori',[
 ['polos','Tanpa Aksesori','awal','#b3bea5','Tampil sederhana.'],['syal','Syal Krem','awal','#e2d7b8','Syal hangat melingkari leher.'],
 ['kacamata','Kacamata Bundar','unik','#b89057','Bingkai emas tipis untuk mata penasaran.'],['daun','Anting Daun','unik','#8ca874','Sepasang daun kecil yang berayun.'],
 ['lentera_ranting','Lentera Ranting','langka','#ffcf66','Lentera kecil kayu dengan cahaya kunang-kunang.',{wood:14,herbs:16}],
 ['bulan','Liontin Rembulan','langka','#b0d6df','Kalung perak berbentuk bulan sabit.'],['aurora','Sayap Aurora','legendaris','#91c9c2','Dua sayap kristal dekoratif di punggung.']]),
 ...group('perlengkapan',[
 ['standar','Perlengkapan Awal','awal','#a9b5b4','Peralatan khas peranmu.'],['kulit','Set Kulit Rantau','awal','#a17c59','Bahan kulit hangat, peran tetap sama.'],
 ['perunggu','Set Perunggu','unik','#ba8b58','Sentuhan logam perunggu.'],['giok','Set Giok','unik','#70aa93','Detail hijau batu giok.'],
 ['lumut_purba','Set Lumut Purba','legendaris','#52967f','Ornamen kayu ukir kuno dilapisi sulur lumut.',{wood:24,herbs:24}],
 ['perak','Set Perak Bulan','langka','#c4d7df','Logam dingin dan batu biru.'],['fajar','Set Penjaga Fajar','legendaris','#e9c362','Detail emas dan kristal amber.']]),
];
export const DEFAULT_LOADOUT:Loadout={baju:'linen',topi:'peran',celana:'arang',aksesori:'polos',perlengkapan:'standar'};
export const itemKey=(item:Pick<Item,'slot'|'id'>)=>`${item.slot}:${item.id}`;
export const STARTER=ITEMS.filter(i=>i.rarity==='awal').map(itemKey);
export const findItem=(slot:Slot,id:string)=>ITEMS.find(i=>i.slot===slot&&i.id===id);
export type WardrobeState={owned:string[];equipped:Loadout;titles?:string[];title?:string};
export function parseCosmetics(raw:unknown):WardrobeState{
 let value:Partial<WardrobeState>={};try{value=typeof raw==='string'?JSON.parse(raw):raw as Partial<WardrobeState>||{};}catch{}
 if(!value||typeof value!=='object')value={};
 const owned=[...new Set([...STARTER,...(Array.isArray(value.owned)?value.owned.filter(k=>typeof k==='string'&&ITEMS.some(i=>itemKey(i)===k)):[])])];
 const equipped={...DEFAULT_LOADOUT};for(const slot of SLOTS){const id=value.equipped?.[slot];if(typeof id==='string'&&owned.includes(`${slot}:${id}`))equipped[slot]=id;}
 const titles=Array.isArray(value.titles)?value.titles.filter(t=>typeof t==='string'):[];
 const title=typeof value.title==='string'&&(titles.includes(value.title)||value.title==='')?value.title:(titles[0]??'');
 return {owned,equipped,titles,title};
}
export function starterWardrobe(equipped?: Partial<Loadout>): WardrobeState {
 if (equipped !== undefined) {
  if (!equipped || typeof equipped !== 'object' || Array.isArray(equipped)) throw new Error('Loadout tidak valid');
  for (const [s, id] of Object.entries(equipped)) {
   if (!SLOTS.includes(s as Slot)) throw new Error('Slot tidak valid');
   if (typeof id !== 'string') throw new Error('ID tidak valid');
   const item = findItem(s as Slot, id);
   if (!item || item.rarity !== 'awal') throw new Error('Item terkunci');
  }
 }
 return {owned: [...STARTER], equipped: {...DEFAULT_LOADOUT, ...(equipped || {})}};
}
const WEIGHTS={unik:60,langka:30,legendaris:10};
export function spinPool(owned:string[]){return ITEMS.filter(i=>i.rarity!=='awal'&&!i.barter&&!owned.includes(itemKey(i)));}
export function spinOdds(owned:string[]){const pool=spinPool(owned);const groups=(Object.entries(WEIGHTS) as [keyof typeof WEIGHTS,number][]).filter(([r])=>pool.some(i=>i.rarity===r));const total=groups.reduce((s,[,w])=>s+w,0);return groups.map(([rarity,weight])=>({rarity,percent:weight/total*100,count:pool.filter(i=>i.rarity===rarity).length}));}
function randomInt(max:number){const limit=4294967296-4294967296%max;let n:number;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=limit);return n%max;}
export function drawItem(owned:string[]){const pool=spinPool(owned);if(!pool.length)return null;const groups=Object.entries(WEIGHTS).filter(([r])=>pool.some(i=>i.rarity===r));let n=randomInt(groups.reduce((s,[,w])=>s+w,0));let rarity=groups[0][0];for(const [r,w] of groups){if(n<w){rarity=r;break;}n-=w;}const choices=pool.filter(i=>i.rarity===rarity);return choices[randomInt(choices.length)];}
export function ticketsFor(xp:number,highest:number,used:number){return Math.max(0,Math.max(highest,getMemberLevel(xp))-1-used);}
