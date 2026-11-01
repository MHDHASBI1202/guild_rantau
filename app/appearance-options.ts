export const HAIR_STYLES=[
 {id:'pendek',name:'Pendek rapi',description:'Potongan pendek tanpa poni kotak.'},
 {id:'samping',name:'Belah samping',description:'Poni menyamping dengan volume ringan.'},
 {id:'bob',name:'Bob pendek',description:'Rambut pendek yang membingkai rahang.'},
 {id:'kuncir',name:'Kuncir rendah',description:'Rambut terikat di belakang kepala.'},
 {id:'panjang',name:'Panjang terurai',description:'Rambut panjang melewati bahu, terurai menyatu ke punggung.'},
 {id:'sebahu',name:'Sebahu berlayer',description:'Rambut sebahu dengan ujung bertingkat.'},
 {id:'gelombang',name:'Panjang bergelombang',description:'Rambut panjang dengan gelombang lembut.'},
 {id:'ekor-panjang',name:'Ekor kuda panjang',description:'Rambut diikat dengan ekor panjang di belakang.'},
 {id:'kepang',name:'Kepang panjang',description:'Kepang tunggal panjang dengan ikat di ujung.'},
 {id:'gundul',name:'Tanpa rambut',description:'Kepala tanpa rambut.'},
] as const;
export type HairStyle=typeof HAIR_STYLES[number]['id'];
export const LONG_HAIR_STYLES:readonly HairStyle[]=['panjang','sebahu','gelombang','ekor-panjang','kepang'];
export const isLongHair=(style:HairStyle)=>LONG_HAIR_STYLES.includes(style);
export const SKIN_TONES=[
 {color:'#f0cfb2',name:'Terang lembut'},
 {color:'#e8bd94',name:'Terang hangat'},
 {color:'#d8a37b',name:'Keemasan'},
 {color:'#b57b52',name:'Sawo matang'},
 {color:'#8d5738',name:'Cokelat'},
 {color:'#593a2b',name:'Cokelat gelap'},
] as const;
export type SkinTone=typeof SKIN_TONES[number]['color'];
export const DEFAULT_HAIR:HairStyle='pendek';
export const DEFAULT_SKIN:SkinTone='#e8bd94';
export const validHair=(v:unknown):v is HairStyle=>HAIR_STYLES.some(h=>h.id===v);
export const validSkin=(v:unknown):v is SkinTone=>SKIN_TONES.some(s=>s.color===v);
