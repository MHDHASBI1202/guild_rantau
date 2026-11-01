# Cloudflare Workers Free + Google

Konfigurasi ini memakai akun Cloudflare milik pengelola, D1, dan Google Identity Services. Tidak memakai login atau gerbang akses Sites. Tidak perlu Google Client Secret.

## 1. Hubungkan Cloudflare

```sh
npx wrangler login
```

Selesaikan login dan izin pada halaman resmi Cloudflare. Pilih paket Free; perintah deployment proyek tidak mengaktifkan paket berbayar.

## 2. Buat database

```sh
npx wrangler d1 create guild-rantau-db
```

Salin `database_id` hasil perintah ke binding `DB` di `wrangler.jsonc`. ID database bukan token. Jangan menyalin kredensial ke GitHub.

## 3. Daftarkan aplikasi Google

Di Google Cloud Console / Google Auth Platform:

1. Buat atau pilih proyek untuk Guild Rantau.
2. Isi nama aplikasi, email dukungan, dan kontak pengembang.
3. Gunakan audience External untuk pemain umum. Tinjau status publikasi dan ketentuan pengguna uji pada Google Auth Platform sebelum peluncuran publik.
4. Buat OAuth Client ID dengan tipe **Web application**.
5. Tambahkan origin website Workers milikmu di **Authorized JavaScript origins**, tanpa path. Untuk deployment Guild Rantau ini, nilai lengkapnya adalah `https://guild-rantau.alah6075.workers.dev`. Bagian subdomain akun `alah6075` harus ikut ditulis. Login Google menolak origin yang tidak cocok dengan error `origin_mismatch`.
6. Untuk pengembangan, tambahkan `http://localhost:5174` dan `http://127.0.0.1:5174` bila diperlukan.
7. Isi Client ID publik ke `vars.GOOGLE_CLIENT_ID` pada `wrangler.jsonc`.

Implementasi memakai tombol resmi Google dengan callback JavaScript. Tidak memerlukan redirect URI OAuth atau Google Client Secret. Atur branding/privacy memakai `/privasi` setelah URL website tersedia. Jangan memasukkan kata sandi Google ke kode.

## 4. Build dan deploy

```sh
npm ci
npm run deploy:cloudflare
```

Perintah memeriksa konfigurasi, membuat build Workers, menerapkan migrasi remote, dan mengunggah Worker beserta aset. Autentikasi Cloudflare menggunakan login Wrangler di komputermu; token tidak disimpan di repositori.

Untuk memeriksa build tanpa publikasi:

```sh
npm run build:cloudflare
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

## Pengembangan Google

```sh
npm run db:setup
npm run dev:cloudflare
```

Mode ini di port 5174 memakai autentikasi Google; header identitas Sites tidak diterima. Mode dev biasa di port 5173 tetap menyediakan simulasi akun localhost untuk pengujian UI.

## Akun dan data

Worker baru memakai D1 baru. Karakter pada hosting Sites lama tidak otomatis ditautkan ke akun Google. Website dan database Sites lama tetap terpisah. Jika ingin memindahkan data lama, rencanakan ekspor dan pemetaan identitas secara terpisah.

Sesi Google disimpan sebagai token acak dalam cookie HttpOnly, dengan hash token di D1. JWT Google diperiksa signature, issuer, audience, masa berlaku, email terverifikasi, dan nonce sekali pakai. Logout menghapus sesi; hapus karakter juga menghapus seluruh sesi akun tersebut.

Paket Free mempunyai kuota. Lihat [Workers](https://developers.cloudflare.com/workers/platform/pricing/) dan [D1](https://developers.cloudflare.com/d1/platform/pricing/) untuk batas terkini. Proyek tidak menambahkan R2 atau layanan berbayar.
