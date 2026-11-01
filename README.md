# Guild Rantau

Dunia fantasi komunitas di sekitar **Rumu**, monster batu yang membawa rumah kecil guild. Anggota memilih karakter, menjalankan aktivitas, dan ikut menumbuhkan kamp bersama.

**Instagram:** [@guild.rantau](https://www.instagram.com/guild.rantau/) · **Website:** [Guild Rantau](https://guild-rantau-rumu.afusion807.chatgpt.site/)

## Fitur

- Dunia 3D low poly, kamera orbit dan mengikuti anggota, serta tampilan siang/malam.
- Enam peran: Penjaga, Peramu, Penjelajah, Perajin, Petani, dan Penyihir.
- Sepuluh gaya rambut gratis untuk kedua gender, enam warna kulit, dan empat warna jubah.
- Lemari dengan 30 kosmetik; tiket spin gratis dari pencapaian level baru.
- Delapan aktivitas dengan XP, inventaris, dan dampak kamp yang tersimpan di server.
- Animasi perjalanan dan bekerja, peralatan aktivitas, efek air/sihir, serta antrean area kerja.
- Progres komunitas: kayu, obat, pagar, tempat istirahat, jalur, bengkel, kebun, dan kristal.
- Ganti nama/peran, acak ulang, reset progres, dan hapus karakter.
- Dukungan layar ponsel dan reduced motion.

## Teknologi

React 19, TypeScript, Three.js, Vinext/Vite, Tailwind CSS, Cloudflare Workers, D1/SQLite, dan Drizzle.

## Menjalankan secara lokal

Prasyarat: **Node.js 22.13 atau lebih baru**, npm, dan Git.

```sh
git clone https://github.com/MHDHASBI1202/guild_rantau.git
cd guild_rantau
npm ci
npm run db:setup
npm run dev -- --port 5173
```

Buka [http://127.0.0.1:5173](http://127.0.0.1:5173). Tombol masuk pada preview loopback menggunakan akun simulasi lokal. Database pengembangan disimpan di `.wrangler/state` dan tidak diunggah ke GitHub.

`npm run db:setup` menerapkan migrasi dari folder `drizzle/` ke database lokal menggunakan `wrangler.local.json`. Jalankan lagi saat ada migrasi baru.

## Build dan pemeriksaan

```sh
npm run build
npx tsc --noEmit
node scripts/test-cosmetics.mjs
node scripts/test-character-fitting.mjs
node scripts/test-activity-animation.mjs
```

Tes API seperti `scripts/test-world-actions.mjs` memerlukan dev server aktif dan hanya digunakan untuk karakter QA pada database lokal. Petunjuk pengujian lebih lengkap tersedia di [catatan implementasi](docs/IMPLEMENTATION.md).

## Struktur utama

```text
app/                       UI, karakter, animasi, dan logika dunia
app/api/guild/route.ts      API anggota, aktivitas, inventaris, dan spin
app/role-options.ts        Katalog peran
app/world-progress.ts      Katalog aktivitas dan progres kamp
db/                        Schema database
drizzle/                   Migrasi database
public/assets/rumu.glb     Model dunia Rumu dan kamp
scripts/                   Perintah pengembangan dan pengujian
worker/                    Entrypoint Cloudflare Workers
```

## Akun dan hosting

Login produksi memakai identitas ChatGPT dari hosting Sites. Satu akun memiliki satu karakter. Login Instagram dan verifikasi follower otomatis belum tersedia.

Hosting aplikasi menggunakan Workers dan D1. Konfigurasi `.openai/hosting.json` mempertahankan ikatan proyek dengan Sites; identitas proyek bukan kredensial login. Untuk hosting mandiri, siapkan database dan integrasi identitas yang sesuai.

Pengunggahan source ke GitHub tidak mengubah izin akses website yang sudah terbit. Visibilitas repositori dan akses website merupakan pengaturan terpisah.

## Batas simulasi saat ini

- Maksimum 12 avatar ditampilkan, termasuk karakter sendiri. Daftar guild menampilkan 100 anggota pertama.
- Aktivitas terakhir divisualisasikan selama sekitar 55 detik, termasuk perjalanan; ini bukan penanda online.
- Setiap area menerima maksimal dua pekerja sekaligus.
- Objek kamp tumbuh sampai enam tahap visual per kategori; angka kontribusi tetap bertambah.
- Kontribusi anggota lain disegarkan setiap 30 detik.
- Voting cerita resmi berlangsung di Instagram.

Source snapshot website diunggah oleh **MHDHASBI1202**. Detail pengembangan tersedia di [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).
