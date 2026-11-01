'use client';
import {useState,type FormEvent} from 'react';
import dynamic from 'next/dynamic';
import {ArrowRight,Check,LockKeyhole,Shirt,Crown,Footprints,Gem,Backpack,Tent} from 'lucide-react';
import GenderPicker from './gender-picker';
import {genderLabel,type Gender} from './character-options';
import {HAIR_STYLES,SKIN_TONES,DEFAULT_HAIR,DEFAULT_SKIN,type HairStyle,type SkinTone} from './appearance-options';
import {ROLE_OPTIONS} from './role-options';
import {ROLE_ICONS} from './role-icons';
import {ITEMS,DEFAULT_LOADOUT,findItem,type Loadout,type Slot} from './cosmetics';
const AvatarPreview=dynamic(()=>import('./avatar-preview'),{ssr:false,loading:()=> <div className="creation-preview-loading">Menyiapkan karakter 3D…</div>});
const COLORS=['#e99552','#8baf9c','#8f9fc8','#c68cab'];
const CATEGORIES:{slot:Slot;label:string;icon:typeof Shirt}[]=[
 {slot:'baju',label:'Baju',icon:Shirt},{slot:'celana',label:'Celana',icon:Footprints},{slot:'topi',label:'Topi',icon:Crown},{slot:'aksesori',label:'Aksesori',icon:Gem},{slot:'perlengkapan',label:'Perlengkapan',icon:Backpack},
];

export default function CharacterCreation(){
 const [name,setName]=useState(''),[gender,setGender]=useState<Gender|null>(null),[skin,setSkin]=useState<SkinTone>(DEFAULT_SKIN),[hair,setHair]=useState<HairStyle>(DEFAULT_HAIR),[role,setRole]=useState('Penjelajah'),[color,setColor]=useState(COLORS[0]);
 const [outfit,setOutfit]=useState<Loadout>({...DEFAULT_LOADOUT}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  if(name.trim().length<2){setError('Isi nama petualang, minimal 2 karakter.');document.getElementById('creation-name')?.focus();return;}
  if(!gender){setError('Pilih gender karaktermu terlebih dahulu.');document.querySelector<HTMLInputElement>('.gender-picker input')?.focus();return;}
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/guild',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join',name:name.trim(),gender,skinTone:skin,hairStyle:hair,role,color,outfit:JSON.stringify(outfit)})});
   const data=await r.json() as {error?:string;me?:unknown};
   if(!r.ok){if(r.status===409&&data.error==='Kamu sudah punya karakter.'){location.assign('/');return;}throw Error(data.error??'Karakter belum berhasil disimpan.');}
   location.assign('/');
  }catch(e){setError(e instanceof Error?e.message:'Koneksi terputus. Coba lagi; pilihanmu tetap ada.');setBusy(false);}
 }
 return <main className="creation-page">
  <header className="creation-header"><span className="eyebrow">KUSTOMISASI AWAL</span><a className="creation-brand" href="/"><Tent size={22}/>GUILD RANTAU</a></header>
  <div className="creation-intro"><span className="eyebrow">SEBELUM LANGKAH PERTAMA</span><h1>Petualang seperti apa<br/><em>yang ingin kamu jadi?</em></h1><p>Mulai dari namamu. Semua pilihan awal gratis, dan penampilan bisa diubah lagi nanti.</p></div>
  <form onSubmit={submit} className="creation-form">
   <fieldset className="creation-name creation-section" disabled={busy}><legend><span>01</span> Nama petualang</legend><label className="sr-only" htmlFor="creation-name">Nama petualang</label><input id="creation-name" name="nickname" autoComplete="nickname" required minLength={2} maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="Kamu ingin dipanggil siapa?"/><small>2–24 karakter. Nama ini akan terlihat oleh anggota guild.</small></fieldset>
   <div className="creation-layout"><div className="creation-fields">
    <section className="creation-section creation-gender" aria-label="Gender"><span className="creation-step">02</span><GenderPicker value={gender} onChange={setGender} disabled={busy}/></section>
    <fieldset className="creation-section" disabled={busy}><legend><span>03</span> Warna kulit</legend><div className="skin-options">{SKIN_TONES.map(s=><button type="button" key={s.color} aria-label={s.name} aria-pressed={skin===s.color} style={{background:s.color}} onClick={()=>setSkin(s.color)}>{skin===s.color&&<Check size={18}/>}</button>)}</div><small>{SKIN_TONES.find(s=>s.color===skin)?.name} · Semua tersedia dari awal.</small></fieldset>
    <fieldset className="creation-section" disabled={busy}><legend><span>04</span> Rambut</legend><div className="hair-options">{HAIR_STYLES.map(h=><button type="button" key={h.id} aria-pressed={hair===h.id} onClick={()=>setHair(h.id)} title={h.description}><b>{h.name}</b>{hair===h.id&&<Check size={14}/>}</button>)}</div><small>{HAIR_STYLES.length} gaya gratis untuk Laki-laki dan Perempuan.</small></fieldset>
    <fieldset className="creation-section" disabled={busy}><legend><span>05</span> Peran di guild</legend><div className="role-options">{ROLE_OPTIONS.map(r=>{const Icon=ROLE_ICONS[r.name];return <button type="button" key={r.name} aria-pressed={role===r.name} className={role===r.name?'picked':''} onClick={()=>setRole(r.name)}><Icon size={21}/><b>{r.name}</b><small>{r.desc}</small></button>;})}</div></fieldset>
    <fieldset className="creation-section creation-outfit" disabled={busy}><legend><span>06</span> Pakaian & perlengkapan</legend><p>10 item awal langsung tersedia. Item terkunci bisa didapat dari spin hadiah level setelah bergabung.</p><div className="creation-colors"><b>Warna jubah</b><div className="swatches">{COLORS.map((c,i)=><button type="button" key={c} aria-label={['Jubah oranye','Jubah hijau','Jubah biru','Jubah ungu'][i]} aria-pressed={color===c} style={{background:c}} onClick={()=>setColor(c)}>{color===c&&<Check size={18}/>}</button>)}</div></div>
     {CATEGORIES.map(({slot,label,icon:Icon})=><section className="creation-category" key={slot} aria-label={label}><h3><Icon size={17}/>{label}<span>{findItem(slot,outfit[slot])?.name}</span></h3><div className="creation-items">{ITEMS.filter(i=>i.slot===slot).map(item=>{const locked=item.rarity!=='awal',chosen=outfit[slot]===item.id;return <button type="button" key={item.id} disabled={busy||locked} aria-label={item.name+(locked?' · Terkunci, hadiah level':'')} aria-pressed={chosen} className={(chosen?'chosen ':'')+(locked?'locked':'')} onClick={()=>setOutfit(o=>({...o,[slot]:item.id}))} title={locked?'Dibuka melalui hadiah level':item.detail}><span className="creation-item-symbol" style={{color:item.color}}><Icon size={25}/>{locked?<LockKeyhole size={12}/>:chosen?<Check size={13}/>:null}</span><b>{item.name}</b><small>{locked?'Hadiah level':'Gratis'}</small></button>;})}</div></section>)}
    </fieldset>
    <div className="creation-submit"><p role="alert" className="creation-error">{error}</p><button className="primary full" disabled={busy||!gender||name.trim().length<2} type="submit">{busy?'Menyimpan petualangmu…':'Simpan karakter & masuk dunia'}<ArrowRight size={18}/></button><small>Nama, penampilan, peran, dan semua pakaian pilihan disimpan bersama ke akunmu.</small></div>
   </div><aside className="creation-preview" aria-label="Preview karakter"><div className="creation-preview-label"><span className="eyebrow">PETUALANGMU</span><span>Preview langsung</span></div><AvatarPreview name={name||'Petualang baru'} role={role} color={color} outfit={outfit} gender={gender} hairStyle={hair} skinTone={skin}/><div className="creation-preview-name"><h2>{name.trim()||'Namamu di sini'}</h2><p>{gender?genderLabel(gender)+' · ':''}{role}</p></div><small>Geser karakter untuk melihat pakaian dari segala sisi.</small></aside></div>
  </form>
 </main>;
}
