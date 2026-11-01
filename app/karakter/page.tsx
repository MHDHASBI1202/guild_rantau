'use client';
import dynamic from 'next/dynamic';
import {useState,useMemo} from 'react';
import {ROLE_OPTIONS} from '../role-options';
import AppearancePicker from '../appearance-picker';
import {DEFAULT_SKIN,type HairStyle,type SkinTone} from '../appearance-options';
import GenderPicker from '../gender-picker';
import type {Gender} from '../character-options';
import {ITEMS,DEFAULT_LOADOUT} from '../cosmetics';
import {ArrowLeft} from 'lucide-react';
const AvatarPreview=dynamic(()=>import('../avatar-preview'),{ssr:false});
const roles=ROLE_OPTIONS.map(r=>({...r,subtitle:'KEAHLIAN · '+r.name.toUpperCase(),description:r.desc}));
export default function Characters(){const [hairStyle,setHairStyle]=useState<HairStyle>('panjang'),[skinTone,setSkinTone]=useState<SkinTone>(DEFAULT_SKIN);const [gender,setGender]=useState<Gender>('perempuan');const [hat,setHat]=useState('terbuka');const outfit=useMemo(()=>({...DEFAULT_LOADOUT,topi:hat}),[hat]);return <div className="role-gallery"><a className="text-button" href="/"><ArrowLeft size={15}/>Kembali ke Guild Rantau</a><div className="eyebrow" style={{marginTop:35}}>BUKU PERAN · GUILD RANTAU</div><h1>Satu perjalanan.<br/><em>Enam cara untuk berarti.</em></h1><p>Setiap peran punya perlengkapan dan ciri sendiri. Siapa pun pilihanmu, ada tempat untukmu di perjalanan ini.</p><div className="gallery-gender"><GenderPicker value={gender} onChange={setGender}/><label className="hat-sample">Contoh penutup kepala<select value={hat} onChange={e=>setHat(e.target.value)}>{ITEMS.filter(i=>i.slot==='topi').map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label></div><div className="gallery-appearance"><AppearancePicker hairStyle={hairStyle} skinTone={skinTone} onHair={setHairStyle} onSkin={setSkinTone}/></div><div className="role-gallery-grid">{roles.map(r=><article className="role-gallery-card" key={r.name}><span className="eyebrow">{r.subtitle}</span><AvatarPreview name={r.name} role={r.name} color={r.color} gender={gender} outfit={outfit} hairStyle={hairStyle} skinTone={skinTone}/><h2>{r.name}</h2><p>{r.description}</p><ul>{r.items.map(i=><li key={i}>◇ {i}</li>)}</ul></article>)}</div><div className="role-gallery-note">Ini contoh tampilan peran. Warna jubah mengikuti pilihan karaktermu dan bisa diganti melalui Karakterku → Pengaturan karakter.</div></div>;}
