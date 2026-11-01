export type BarterType = 'ticket' | 'cosmetic' | 'title';

export interface BarterItem {
  id: string;
  name: string;
  type: BarterType;
  description: string;
  woodCost: number;
  herbsCost: number;
  cosmeticKey?: string;
  slot?: 'topi' | 'baju' | 'aksesori' | 'perlengkapan' | 'celana';
  titleText?: string;
  badgeColor?: string;
  icon?: string;
}

export const BARTER_CATALOG: BarterItem[] = [
  // 1. TIKET SPIN
  {
    id: 'barter_ticket',
    name: '1 Tiket Spin Gratis',
    type: 'ticket',
    description: 'Tukar persediaan rantau dengan Aru untuk mendapat 1 kesempatan memutar roda hadiah di Lemari.',
    woodCost: 8,
    herbsCost: 8,
    icon: 'ticket',
  },

  // 2. KOSMETIK EKSKLUSIF RIMBA
  {
    id: 'cosmetic_caping',
    name: 'Caping Bambu Rimba',
    type: 'cosmetic',
    cosmeticKey: 'topi:caping',
    slot: 'topi',
    description: 'Anyaman bambu tradisional dan daun lebar untuk menaungi kepala dari terik siang Hutan Bisik.',
    woodCost: 16,
    herbsCost: 12,
  },
  {
    id: 'cosmetic_rompi',
    name: 'Rompi Pengrajin Rimba',
    type: 'cosmetic',
    cosmeticKey: 'baju:rompi_pengrajin',
    slot: 'baju',
    description: 'Rompi berkantung ganda dari kulit pohon kokoh dan benang serat alami.',
    woodCost: 18,
    herbsCost: 12,
  },
  {
    id: 'cosmetic_lentera',
    name: 'Lentera Ranting Hutan',
    type: 'cosmetic',
    cosmeticKey: 'aksesori:lentera_ranting',
    slot: 'aksesori',
    description: 'Lentera kayu mungil berisi kunang-kunang hutan yang memberi pendar hangat di malam hari.',
    woodCost: 14,
    herbsCost: 16,
  },
  {
    id: 'cosmetic_lumut',
    name: 'Set Lumut Purba',
    type: 'cosmetic',
    cosmeticKey: 'perlengkapan:lumut_purba',
    slot: 'perlengkapan',
    description: 'Ornamen kayu ukir kuno bersulur lumut bercahaya peninggalan penjaga hutan terdahulu.',
    woodCost: 24,
    herbsCost: 24,
  },

  // 3. TAG NAMA / GELAR PETUALANG
  {
    id: 'title_sahabat_rumu',
    name: 'Sahabat Rumu',
    type: 'title',
    titleText: 'Sahabat Rumu',
    badgeColor: '#e99552',
    description: 'Gelar hangat bagi petualang yang senantiasa menemani dan merawat langkah Rumu.',
    woodCost: 18,
    herbsCost: 18,
  },
  {
    id: 'title_pemahat_hutan',
    name: 'Pemahat Hutan',
    type: 'title',
    titleText: 'Pemahat Hutan',
    badgeColor: '#bfa068',
    description: 'Gelar bagi pengrajin dan penebang yang rajin mengumpulkan kayu di sekeliling kamp.',
    woodCost: 20,
    herbsCost: 6,
  },
  {
    id: 'title_penenun_rimba',
    name: 'Penenun Rimba',
    type: 'title',
    titleText: 'Penenun Rimba',
    badgeColor: '#789f72',
    description: 'Gelar bagi peramu teliti yang memahami rahasia setiap dedaunan obat di Hutan Bisik.',
    woodCost: 6,
    herbsCost: 20,
  },
  {
    id: 'title_penjaga_api',
    name: 'Penjaga Api Malam',
    type: 'title',
    titleText: 'Penjaga Api',
    badgeColor: '#d66848',
    description: 'Gelar penjaga ketentraman yang memastikan api unggun kamp tidak pernah padam.',
    woodCost: 15,
    herbsCost: 15,
  },
  {
    id: 'title_pengelana_fajar',
    name: 'Pengelana Fajar',
    type: 'title',
    titleText: 'Pengelana Fajar',
    badgeColor: '#8a78b5',
    description: 'Gelar kehormatan untuk petualang sejati yang selalu menanti terbitnya matahari di garis depan.',
    woodCost: 28,
    herbsCost: 28,
  },
];
