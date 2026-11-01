export const GENDERS=['laki-laki','perempuan'] as const;
export type Gender=typeof GENDERS[number];
export const normalizeGender=(value:unknown):Gender|null=>GENDERS.includes(value as Gender)?value as Gender:null;
export const genderLabel=(gender?:Gender|null)=>gender==='laki-laki'?'Laki-laki':gender==='perempuan'?'Perempuan':'';
