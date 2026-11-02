/**
 * =====================================================================
 * SISTEM MILESTONE GUILD RANTAU
 * =====================================================================
 * Kamu bisa dengan bebas mengatur angka-angka milestone di bawah ini
 * kapan saja sesuai kebutuhan dan perkembangan ceritamu!
 */

// ---------------------------------------------------------------------
// 1. MILESTONE LEVEL ANGGOTA (EXP)
// ---------------------------------------------------------------------
// Makin tinggi level anggota, makin banyak EXP yang dibutuhkan untuk naik level.
// requiredTotalXp adalah akumulasi total EXP yang harus dicapai untuk menyentuh level tersebut.
export const MEMBER_LEVEL_MILESTONES = [
 { level: 1, requiredTotalXp: 0, title: 'Pemula' },
 { level: 2, requiredTotalXp: 100, title: 'Penjelajah Muda' },     // butuh 100 XP (dari 0)
 { level: 3, requiredTotalXp: 250, title: 'Perantau Terbiasa' },   // butuh 150 XP lagi (total 250)
 { level: 4, requiredTotalXp: 450, title: 'Kawan Seperjalanan' }, // butuh 200 XP lagi (total 450)
 { level: 5, requiredTotalXp: 700, title: 'Pelindung Kamp' },     // butuh 250 XP lagi (total 700)
 { level: 6, requiredTotalXp: 1000, title: 'Petualang Tangguh' },  // butuh 300 XP lagi (total 1000)
 { level: 7, requiredTotalXp: 1400, title: 'Perintis Jalur' },    // butuh 400 XP lagi (total 1400)
 { level: 8, requiredTotalXp: 1900, title: 'Penjaga Kehormatan' }, // butuh 500 XP lagi (total 1900)
 { level: 9, requiredTotalXp: 2500, title: 'Legenda Hutan' },     // butuh 600 XP lagi (total 2500)
 { level: 10, requiredTotalXp: 3200, title: 'Tetua Guild' },      // butuh 700 XP lagi (total 3200)
] as const;

/**
 * Menghitung level anggota dari total XP yang dimiliki.
 */
export function getMemberLevel(xp: number): number {
 const safeXp = Math.max(0, xp || 0);
 for (let i = MEMBER_LEVEL_MILESTONES.length - 1; i >= 0; i--) {
  if (safeXp >= MEMBER_LEVEL_MILESTONES[i].requiredTotalXp) {
   return MEMBER_LEVEL_MILESTONES[i].level;
  }
 }
 return 1;
}

/**
 * Menghitung detail progres EXP anggota untuk tampilan progress bar di UI.
 */
export function getMemberXpProgress(xp: number) {
 const safeXp = Math.max(0, xp || 0);
 const level = getMemberLevel(safeXp);
 const currentTier = MEMBER_LEVEL_MILESTONES.find(m => m.level === level) || MEMBER_LEVEL_MILESTONES[0];
 const nextTier = MEMBER_LEVEL_MILESTONES.find(m => m.level === level + 1);

 if (!nextTier) {
  return {
   level,
   title: currentTier.title,
   currentInLevel: safeXp - currentTier.requiredTotalXp,
   neededInLevel: 100,
   percent: 100,
   nextRewardLevel: level + 1,
   isMaxLevel: true,
  };
 }

 const neededInLevel = nextTier.requiredTotalXp - currentTier.requiredTotalXp;
 const currentInLevel = Math.max(0, safeXp - currentTier.requiredTotalXp);
 const percent = Math.min(100, Math.max(0, Math.floor((currentInLevel / neededInLevel) * 100)));

 return {
  level,
  title: currentTier.title,
  currentInLevel,
  neededInLevel,
  percent,
  nextRewardLevel: level + 1,
  isMaxLevel: false,
 };
}

// ---------------------------------------------------------------------
// 2. MILESTONE LEVEL RUMU (BERDASARKAN JUMLAH ANGGOTA)
// ---------------------------------------------------------------------
// Jika kamu ingin menentukan level Rumu secara manual (misal belum mau otomatis naik),
// cukup ubah MANUAL_RUMU_LEVEL di bawah ini ke angka levelnya (misal: 1, 2, dst.),
// atau setel ke `null` untuk menggunakan perhitungan otomatis berdasarkan jumlah anggota.
export const MANUAL_RUMU_LEVEL: number | null = null; // Ubah ke angka (misal: 1) jika ingin mengunci levelnya sendiri

export type RumuMilestone = {
 level: number;
 minMembers: number;        // Jumlah anggota minimal untuk mencapai level ini
 title: string;             // Gelar / julukan Rumu
 scaleMultiplier: number;   // Pengali ukuran 3D Rumu di kanvas (1.0 = ukuran awal)
 description: string;       // Deskripsi lore & kamp
 quote: string;             // Ucapan khas Rumu pada level ini
};

export const RUMU_LEVEL_MILESTONES: RumuMilestone[] = [
 {
  level: 1,
  minMembers: 0,
  title: 'Monster Batu Ramah',
  scaleMultiplier: 1.0,
  description: 'Badannya besar, nyalinya belum. Punggungnya cukup untuk satu tenda dan dua ranjang gulung.',
  quote: 'Pelan-pelan saja. Yang penting kita jalan bersama.',
 },
 {
  level: 2,
  minMembers: 5,
  title: 'Penjaga Lembah Hijau',
  scaleMultiplier: 1.08,
  description: 'Langkahnya kian mantap. Lumut hijau di punggungnya tumbuh subur — dan Barak Guild kini berdiri tegak, tempat para perantau beristirahat setelah hari yang panjang.',
  quote: 'Krrr... kawan-kawan baru membawa rasa hangat di punggungku.',
 },
 {
  level: 3,
  minMembers: 15,
  title: 'Rumah Berjalan Perantau',
  scaleMultiplier: 1.16,
  description: 'Teras belakang Rumu terbuka dengan empat ranjang tambahan. Menara hasil pilihan guild kini berdiri, lengkap dengan lentera untuk menerangi tepi kamp.',
  quote: 'Bebannya tidak terasa berat kalau dipikul ramai-ramai.',
 },
 {
  level: 4,
  minMembers: 30,
  title: 'Benteng Karang Penjelajah',
  scaleMultiplier: 1.25,
  description: 'Tanduk kristal birunya bersinar terang membelah kabut tebal Hutan Bisik di kala malam.',
  quote: 'Ke mana pun arah kompas menunjuk, kita terobos bersama.',
 },
 {
  level: 5,
  minMembers: 50,
  title: 'Kota Berjalan Rantau',
  scaleMultiplier: 1.35,
  description: 'Bukan lagi sekadar monster petualang—Rumu telah menjadi legenda rumah berjalan bagi seluruh guild.',
  quote: 'Inilah rumah kita. Tempat berlabuhnya semua langkah pengelana.',
 },
];

/**
 * Mengambil data status milestone Rumu saat ini dan target milestone berikutnya.
 */
export function getRumuMilestone(totalMembers: number) {
 const safeTotal = Math.max(0, totalMembers || 0);

 // Jika kamu menentukan level secara manual:
 if (MANUAL_RUMU_LEVEL !== null) {
  const manual = RUMU_LEVEL_MILESTONES.find(m => m.level === MANUAL_RUMU_LEVEL) || RUMU_LEVEL_MILESTONES[0];
  const nextTier = RUMU_LEVEL_MILESTONES.find(m => m.level === manual.level + 1) || null;
  return {
   current: manual,
   next: nextTier,
   progressPercent: 100,
   membersNeeded: 0,
   isManual: true,
  };
 }

 // Otomatis berdasarkan jumlah anggota:
 let current = RUMU_LEVEL_MILESTONES[0];
 for (const m of RUMU_LEVEL_MILESTONES) {
  if (safeTotal >= m.minMembers) {
   current = m;
  }
 }

 const nextIndex = RUMU_LEVEL_MILESTONES.findIndex(m => m.level === current.level) + 1;
 const next = nextIndex < RUMU_LEVEL_MILESTONES.length ? RUMU_LEVEL_MILESTONES[nextIndex] : null;

 let progressPercent = 100;
 let membersNeeded = 0;

 if (next) {
  const span = next.minMembers - current.minMembers;
  const done = safeTotal - current.minMembers;
  progressPercent = Math.min(100, Math.max(0, Math.floor((done / span) * 100)));
  membersNeeded = Math.max(0, next.minMembers - safeTotal);
 }

 return {
  current,
  next,
  progressPercent,
  membersNeeded,
  isManual: false,
 };
}
