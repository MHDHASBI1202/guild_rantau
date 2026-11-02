export type Subrole = {
 readonly name: string;
 readonly desc: string;
};

export const ROLE_OPTIONS = [
 {
  name: 'Penjaga',
  desc: 'Melindungi kamp dan teman seperjalanan.',
  color: '#8f9fc8',
  items: ['Helm dan pelindung dada', 'Perisai pilihan jubah', 'Pedang tersimpan di sarung'],
  specialty: 'guard',
  subroles: [
   { name: 'Ksatria Pelindung', desc: 'Garda pertahanan kokoh, melindungi kamp dan kawan.' },
   { name: 'Pengawal Benteng', desc: 'Ahli barikade dan pertahanan perkemahan.' },
   { name: 'Penjaga Garda Depan', desc: 'Berani menghadapi ancaman di garis terdepan.' },
  ],
 },
 {
  name: 'Peramu',
  desc: 'Merawat bekal obat dan kehidupan kamp.',
  color: '#8baf9c',
  items: ['Tudung dan tas herbal', 'Ikatan daun obat', 'Botol ramuan di sabuk'],
  specialty: 'herbs',
  subroles: [
   { name: 'Ahli Obat Rimba', desc: 'Peracik ramuan penyembuh dari getah dan daun.' },
   { name: 'Pencari Herba', desc: 'Penjelajah semak pencari tanaman langka.' },
   { name: 'Peramu Jamu', desc: 'Penyeduh ekstrak penambah tenaga para petualang.' },
  ],
 },
 {
  name: 'Penjelajah',
  desc: 'Membuka jalan dan menemukan rute baru.',
  color: '#e99552',
  items: ['Topi berbulu', 'Ransel dan peta', 'Kompas perjalanan'],
  specialty: 'explore',
  subroles: [
   { name: 'Perintis Jalur', desc: 'Pencari rute aman menembus kabut hutan.' },
   { name: 'Pengintai Rimba', desc: 'Mata elang pengamat dari puncak pepohonan.' },
   { name: 'Pemburu Jejak', desc: 'Pakar membaca jejak satwa dan tanda alam.' },
  ],
 },
 {
  name: 'Perajin',
  desc: 'Mengubah bahan sederhana menjadi rumah.',
  color: '#c18b64',
  items: ['Topi kerja', 'Celemek kulit', 'Palu dan sabuk perkakas'],
  specialty: 'build',
  subroles: [
   { name: 'Tukang Kayu', desc: 'Ahli struktur pondasi dan papan kemah.' },
   { name: 'Pandai Besi', desc: 'Penempa perkakas kerja dan paku baja.' },
   { name: 'Arsitek Kemah', desc: 'Perancang kenyamanan dan tata letak perkemahan.' },
  ],
 },
 {
  name: 'Petani',
  desc: 'Menumbuhkan kebun dan harapan baru.',
  color: '#92a66d',
  items: ['Topi ladang', 'Penyiram tanaman', 'Kantong benih'],
  specialty: 'plant',
  subroles: [
   { name: 'Penanam Pangan', desc: 'Penyemai benih sayur dan lumbung makanan.' },
   { name: 'Penyubur Tanah', desc: 'Pengolah humus dan kompos di petak kebun.' },
   { name: 'Pemelihara Kebun', desc: 'Perawat tunas hijau dan kebun buah kamp.' },
  ],
 },
 {
  name: 'Penyihir',
  desc: 'Menjaga Rumu dengan pelindung sihir.',
  color: '#a496bd',
  items: ['Topi runcing', 'Tongkat kristal', 'Buku mantra di sabuk'],
  specialty: 'ward',
  subroles: [
   { name: 'Penyihir Elemen', desc: 'Mengendalikan kekuatan alam dan energi magis murni.' },
   { name: 'Penyembuh Roh', desc: 'Memulihkan stamina dan luka kawan dengan sihir lembut.' },
   { name: 'Penenun Mantra', desc: 'Merajut kristal pelindung dan penangkal marabahaya.' },
  ],
 },
] as const;

export const ROLES: readonly string[] = ROLE_OPTIONS.map(r => r.name);

export function getSubrolesForRole(roleName: string): readonly Subrole[] {
 const role = ROLE_OPTIONS.find(r => r.name === roleName);
 return role ? role.subroles : [];
}

export function defaultSubrole(roleName: string): string {
 const subroles = getSubrolesForRole(roleName);
 return subroles[0]?.name ?? '';
}

export function validSubrole(roleName: string, subroleName: string): boolean {
 const subroles = getSubrolesForRole(roleName);
 return subroles.some(s => s.name === subroleName);
}
