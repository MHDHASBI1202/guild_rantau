# Guild Rantau

Dunia 3D komunitas dengan aset Rumu/Aru asli, kamera orbit, siang/malam, karakter tersimpan, peran/jubah, ranjang, inventaris, aktivitas dengan cooldown server, daftar anggota dan jurnal.

## Menjalankan
- `npm run dev -- --port 5173`
- `npm run build`
- `npx tsc --noEmit`
- Database D1 binding `DB`; migrasi di `drizzle/`. Preview memakai `.wrangler/state`, terpisah dari produksi.
- Login lokal simulasi hanya di loopback: `/signin-with-chatgpt?return_to=/`.
- Hosting memakai identitas ChatGPT milik Sites. Email tidak disimpan/dipublikasikan dalam daftar anggota.

## Batas versi pertama
- Publikasi awal privat untuk pemilik; belum terbuka untuk follower.
- Follow Instagram belum diverifikasi otomatis. Akun resmi: [@guild.rantau](https://www.instagram.com/guild.rantau/). Tombol voting membuka profil; pengunjung diarahkan mencari komentar episode 1.
- Voting resmi di Instagram, tidak dihitung oleh website ini.
- Ranjang adalah alokasi di buku guild, bukan penambahan satu ranjang fisik ke model kamp yang baru memiliki dua bedroll.
- Maksimal 12 avatar anggota digambarkan berjalan di lingkungan kamp. Ini ilustrasi kehidupan; bukan multiplayer real-time atau indikator online. Daftar menampilkan 100 anggota pertama.
- Siang/malam adalah pengaturan tampilan. Hutan Bisik adalah lokasi fiksi.
- Aktivitas mengubah inventaris/XP tersimpan dan menunggu 60 detik, bukan simulasi survival offline.
- Model berasal dari produksi lokal Blender v2; tanpa kredit CapCut tambahan.

## Verifikasi
Build produksi dan TypeScript. QA browser: login lokal, pembuatan karakter, aksi mencari kayu, cooldown, persistensi setelah reload, ransel, navigasi, viewport 390 px. Data pengujian berada hanya di database lokal.

## Pengaturan karakter
Buka Karakterku → Pengaturan karakter. Edit nama/peran/jubah mempertahankan progres. Reroll memilih peran dan warna lain tanpa mengubah XP/inventaris/ranjang. Reset memerlukan ketikan MULAI ULANG dan mengosongkan XP, hasil aktivitas serta cooldown, mempertahankan identitas dan alokasi ranjang. Hapus memerlukan HAPUS dan nama karakter yang cocok; menghapus baris anggota milik identitas yang masuk, bukan akun ChatGPT/Instagram. Tidak ada migrasi schema baru.

Tes API lokal: `node scripts/test-character-settings.mjs` (server dev harus hidup; hanya akun QA lokal yang dikenali). Menguji auth, origin, validasi, edit, cooldown, reroll, reset, hapus, persistensi dan daftar kembali. Tes tidak dijalankan terhadap data produksi.

## Model anggota berdasarkan peran
Factory `app/avatar-model.ts` dipakai bersama oleh dunia dan preview profil/pemilihan karakter. Penjaga: helm, pelindung dada, perisai, pedang tersarung. Peramu: tudung, tas, daun obat dan botol ramuan. Penjelajah: topi, kompas, ransel, gulungan alas tidur dan peta. Warna jubah menggunakan data anggota. Rig menggerakkan kaki/lengan/kepala, dan menghormati reduced motion. Ilustrasi badge ringan dipakai di daftar supaya tidak membuat banyak konteks WebGL. Kartu anggota dapat diklik untuk melihat preview 3D yang bisa diputar. Halaman `/karakter` memperlihatkan ketiga peran sebagai contoh, tanpa membuat anggota palsu.
Tes model: `node --experimental-strip-types scripts/test-avatar-models.mjs`.

## Lemari dan spin hadiah level
Lemari memiliki 30 item di 5 slot (baju, topi, celana, aksesori, perlengkapan). Dua item awal per slot tersedia gratis. 20 kosmetik lainnya dapat dibuka dengan spin. Item kosmetik tidak mengubah kekuatan/peran; perlengkapan menyesuaikan bentuk peran. Preview item terkunci adalah coba tampilan, bukan kepemilikan. Semua outfit yang dipakai divalidasi server dan diterapkan pada model dunia, profil, dan badge anggota.

Setiap 100 XP menaikkan satu level. Mulai level 2, setiap level tertinggi yang baru dicapai memberi 1 tiket. Level yang sudah dicapai sebelum fitur dirilis juga dihitung. Rumus saldo: max(level tertinggi tersimpan, level dari XP) - 1 - spin terpakai. Reset XP mempertahankan koleksi/tiket/high-water level sehingga tidak bisa digunakan untuk farming tiket. Hapus karakter menghapus koleksi dan riwayat melalui FK cascade.

Spin gratis saja, tanpa pembelian, hadiah bernilai uang, atau trading. Tidak ada duplikat. Peluang awal kategori Unik 60%, Langka 30%, Legendaris 10%; merata per item di kategori. Kategori yang selesai dikeluarkan dan sisa bobot dinormalisasi. Jika koleksi lengkap, spin ditolak tanpa memotong tiket. Peluang aktual ditampilkan di UI.

D1 batch menyimpan receipt dan memotong tiket secara atomik dengan optimistic concurrency dan attempt marker. UUID request memberi idempotensi: retry mengambil hasil lama tanpa konsumsi kedua. SessionStorage hanya menyimpan request ID yang menunggu hasil; catatan dan kepemilikan tetap di D1. Hasil disimpan sebelum animasi. Riwayat terakhir tersedia setelah reload.

Migrasi tambahan: `0001_adorable_rhino.sql`, `0002_sweet_hairball.sql` (index riwayat per anggota). Uji `node scripts/test-cosmetics.mjs` untuk katalog/odds/90 model; `node scripts/test-wardrobe-api.mjs` untuk hadiah level, request bersamaan, retry, item terkunci, reset, kepemilikan, koleksi lengkap, dan cascade. Tes API memerlukan dev server dan database LOKAL, serta hanya mengubah karakter QA `local_seedy`; seed level dan tiket demo tidak pernah dijalankan di produksi.

## Gender dan penampilan gratis
Pilihan gender hanya Laki-laki dan Perempuan. Pembuatan memerlukan pilihan eksplisit; API menolak nilai lain. Rekaman lama dengan sentinel legacy dibaca sebagai `null` (belum dipilih), diberi pengingat di UI, dan tidak ditetapkan gender otomatis. Migrasi historis tetap utuh.

Sepuluh gaya rambut (pendek, belah samping, bob, kuncir rendah, panjang terurai, sebahu berlayer, panjang bergelombang, ekor kuda panjang, kepang panjang, tanpa rambut) dan enam warna kulit tersedia gratis untuk kedua gender. Pilihan tersimpan di D1 melalui kolom hair_style/skin_tone, terpisah dari koleksi gacha dan tiket. Default akun lama pendek rapi/terang hangat; ganti penampilan tidak mengubah XP, ranjang, koleksi, atau tiket. Kontrol tersedia saat gabung dan dalam Pengaturan karakter, juga bisa dibuka dari Lemari. Preview, ikon profil, daftar anggota, dan karakter di dunia memakai pilihan tersimpan.

Rambut menyesuaikan ruang penutup kepala: cap dihilangkan untuk helm/tudung/topi bertepi/baret, tudung menutupi rambut, dan mahkota memakai ring berongga. Galeri `/karakter` menyediakan kontrol untuk membandingkan gaya/warna/topi secara lokal tanpa mengubah akun.

Verifikasi: `node scripts/test-character-fitting.mjs` (720 kombinasi gender/gaya/peran/topi/kacamata), `node scripts/test-appearance-api.mjs` (LOCAL QA: 60 kombinasi tersimpan dan publik, validasi, gender independen, progres/tiket/koleksi tetap), serta tes model dan kosmetik.


Fitting rambut panjang: panjang terurai, berlayer, dan bergelombang diarahkan melewati bagian belakang bahu di luar jubah; ekor/kepang juga berada di luar jubah. Ransel dan gulungan digeser beserta jalur tali bahu. Ayunan kepala untuk rambut panjang dibatasi agar jarak aman terjaga. Tudung menyembunyikan rambut, helm/topi memangkas bagian akar, dan anting bergeser ke ruang yang terlihat. Tidak ada gaya atau jumlah pilihan berdasarkan gender.

`node scripts/test-hair-collisions.mjs` memeriksa perpotongan permukaan dua arah (tepi segitiga terhadap mesh), bukan hanya bounding box: 1.080 kombinasi rambut/peran/topi/aksesori, baju diputar mencakup keenam pilihan, pada tiga pose berjalan (3.240 pose). Termasuk wajah, mata, telinga, topi, mahkota, anting, baju, pelindung bahu, jubah, tas, tali, dan sayap. Kontak antara bagian rambut sendiri dan alis tidak dianggap tabrakan. Ini verifikasi kombinasi/pose yang dicakup, bukan simulasi fisika rambut kontinu.


## Enam peran dan kamp bersama
Katalog `role-options.ts` dipakai bersama oleh pendaftaran, pengaturan, galeri, bonus aktivitas, dan API. Tersedia Penjaga, Peramu, Penjelajah, Perajin, Petani, Penyihir. Model baru memiliki topi kerja/celemek/palu, topi ladang/penyiram/benih, serta topi runcing/tongkat/buku mantra. Semua opsi penampilan tetap tersedia.

Delapan aktivitas memberi dampak permanen ke `camp_state`: kayu, ramuan, pertahanan, kenyamanan, eksplorasi, kerajinan, kebun, energi sihir. Keahlian peran yang cocok memberi 2 kontribusi dan tambahan 3 XP; aktivitas lain tetap bisa dilakukan siapa pun. Barang pribadi kayu/daun tetap masuk ransel, sedangkan dampak komunitas tidak mengurangi barang itu. Tidak ada biaya material untuk aksi baru pada tahap ini.

Satu batch transaksi D1 mencatat kuitansi `world_events`, memperbarui progres anggota, dan menambah satu kolom kamp. ID permintaan melindungi pengiriman ulang/concurrency; nilai hadiah dan kolom dampak berasal dari katalog server. Cooldown 60 detik berlaku lintas aktivitas, termasuk setelah reset progres. Hapus karakter menghapus riwayat pribadinya melalui FK cascade, sementara agregat pembangunan kamp milik komunitas tetap ada. Progres lingkungan dimulai dari aktivitas yang dilakukan setelah fitur ini hadir, tanpa menebak ulang riwayat aktivitas lama.

Dunia menampilkan kayu, rak ramuan, pagar, alas istirahat, penanda jalur, bengkel, tanaman, dan kristal di sekitar Rumu. Setiap kategori menampilkan maksimum enam unit pertumbuhan untuk membatasi objek 3D; penghitung kontribusi tetap bertambah. Update diri sendiri langsung diterapkan, kontribusi anggota lain disegarkan setiap 30 detik. Ini progres kolektif persisten, bukan simulasi ekonomi atau fisika dunia penuh.

Verifikasi lokal: `node scripts/test-world-actions.mjs` (8 dampak pribadi/komunitas/objek 3D, 6 peran, validasi hadiah, penyimpanan, retry/concurrency, cooldown/reset, data publik), `node scripts/test-character-fitting.mjs` (1.440 kombinasi), dan `node scripts/test-hair-collisions.mjs` (2.160 kombinasi, tiga pose). Semua QA memakai loopback dan karakter uji, bukan karakter produksi.


## Interaksi aktivitas anggota
API publik kini menyertakan waktu aktivitas terakhir. Animasi memakai aktivitas yang tersimpan selama 55 detik, termasuk perjalanan, kemudian anggota kembali berjalan santai. Ini bukan indikator online atau pemberian hadiah tambahan. Semua delapan aktivitas memiliki properti sementara dan pose sendiri: membawa kayu, meramu, menjaga dengan lentera, merapikan ranjang, membuka peta, memalu di bengkel, menyiram dengan tetesan air, dan menyalurkan energi ke kristal. Peralatan peran yang mengganggu disembunyikan sementara dan dipulihkan setelah bekerja.

Aktor dipertahankan berdasarkan nomor ranjang dan tampilan; polling tidak membuat ulang aktor atau mengulang rute. Maksimum dua pekerja per area, sisanya menunggu giliran sambil berjalan di kamp. Rute mengikuti jalur oval di luar ruang Rumu, lalu menuju titik kerja. Adegan menampilkan maksimum 12 anggota, memprioritaskan karakter sendiri. Tombol Ikuti pada panel aktivitas memfokuskan kamera; aktivitas sendiri otomatis membuka Dunia dan memfokuskan area kerja. Reduced motion memakai pose statis di area kerja dan efek statis.

Verifikasi: `node scripts/test-activity-animation.mjs` mencakup 128 perjalanan/titik kerja, batas Rumu, gerak kontinu, selesai/kembali, polling, antrean, 480 kombinasi peran/rambut/aktivitas, pemulihan alat, dan reduced motion. `scripts/seed-activity-preview.mjs` hanya membuat fixture QA di D1 lokal, tidak dibawa ke produksi.

Kamera mengikuti posisi anggota dengan peralihan halus dari sisi luar kamp. Pohon yang menghalangi pandangan disembunyikan sementara; drag/zoom melepas mode mengikuti dan menampilkan pepohonan kembali. `node scripts/seed-activity-preview.mjs --clear` menghapus hanya delapan fixture QA tersebut dari D1 lokal.
