'use client';
import {useId} from 'react';
import {GENDERS,genderLabel,type Gender} from './character-options';
export default function GenderPicker({value,onChange,disabled=false}:{value:Gender|null;onChange:(g:Gender)=>void;disabled?:boolean}){
 const id=useId();return <fieldset className="gender-picker" disabled={disabled}><legend>Gender karakter</legend><div>{GENDERS.map(g=><label key={g}><input type="radio" name={id} value={g} checked={value===g} onChange={()=>onChange(g)}/><span>{genderLabel(g)}</span></label>)}</div><small>Pilih Laki-laki atau Perempuan. Semua peran dan item tetap tersedia.</small></fieldset>;
}
