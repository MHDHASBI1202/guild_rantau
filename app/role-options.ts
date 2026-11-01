export const ROLE_OPTIONS=[
 {name:'Penjaga',desc:'Melindungi kamp dan teman seperjalanan.',color:'#8f9fc8',items:['Helm dan pelindung dada','Perisai pilihan jubah','Pedang tersimpan di sarung'],specialty:'guard'},
 {name:'Peramu',desc:'Merawat bekal obat dan kehidupan kamp.',color:'#8baf9c',items:['Tudung dan tas herbal','Ikatan daun obat','Botol ramuan di sabuk'],specialty:'herbs'},
 {name:'Penjelajah',desc:'Membuka jalan dan menemukan rute baru.',color:'#e99552',items:['Topi berbulu','Ransel dan peta','Kompas perjalanan'],specialty:'explore'},
 {name:'Perajin',desc:'Mengubah bahan sederhana menjadi rumah.',color:'#c18b64',items:['Topi kerja','Celemek kulit','Palu dan sabuk perkakas'],specialty:'build'},
 {name:'Petani',desc:'Menumbuhkan kebun dan harapan baru.',color:'#92a66d',items:['Topi ladang','Penyiram tanaman','Kantong benih'],specialty:'plant'},
 {name:'Penyihir',desc:'Menjaga Rumu dengan pelindung sihir.',color:'#a496bd',items:['Topi runcing','Tongkat kristal','Buku mantra di sabuk'],specialty:'ward'},
] as const;
export const ROLES:readonly string[]=ROLE_OPTIONS.map(r=>r.name);
