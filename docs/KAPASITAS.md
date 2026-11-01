# Kapasitas pemain Guild Rantau

Catatan 1 November 2026. Ini penjelasan batas implementasi dan kuota paket gratis, bukan hasil uji beban atau jaminan jumlah pemain bersamaan.

## Batas dalam aplikasi

- Satu akun Google memiliki satu karakter tersimpan di D1. Kode tidak menetapkan batas jumlah akun terdaftar.
- Dunia merender paling banyak 12 avatar per perangkat. Daftar guild mengambil 100 anggota pertama. Anggota yang berada di luar daftar tetap memiliki progres, tetapi belum tersedia pencarian/paginasi server untuk seluruh populasi.
- Dua anggota dapat bekerja di setiap stasiun. Delapan aktivitas memiliki area berbeda; aktivitas terakhir divisualisasikan sekitar 55 detik, termasuk perjalanan. Ini bukan indikator pemain online.
- Browser mengambil ulang data dunia setiap 30 detik. Gerakan 3D dijalankan di perangkat pemain, bukan disiarkan frame demi frame dari server.

## Kuota Cloudflare Free

| Sumber daya | Batas paket gratis |
| --- | --- |
| Workers dinamis | 100.000 request per hari per akun |
| CPU Worker | 10 ms per invocation |
| D1 baris dibaca | 5 juta per hari per akun |
| D1 baris ditulis | 100.000 per hari per akun |
| Ukuran satu database D1 | 500 MB |

Sumber resmi: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). Kuota harian direset pada 00.00 UTC. Layanan lain pada akun yang sama juga dapat memakai kuota tersebut.

## Menghitung perkiraan penggunaan

Untuk satu tab per pemain, polling saja menghasilkan kira-kira:

`request polling = jumlah pemain × menit bermain × 2`

Contoh: 100 pemain masing-masing bermain selama satu jam menghasilkan sekitar 12.000 request polling. Angka itu belum mencakup pemuatan halaman, login, aktivitas, atau operasi lain. Jika 100 pemain membiarkan dunia terbuka sepanjang 24 jam, polling saja menghasilkan 288.000 request dan melewati kuota Workers Free.

Request bukan jumlah query atau baris dibaca. Satu respons dunia juga mengambil daftar anggota, jumlah anggota, profil pribadi, riwayat spin, keadaan kamp, dan peristiwa. Pengurutan/pemindaian tabel dapat membaca lebih banyak baris daripada 100 anggota yang dikirim ke browser. Karena itu, kuota D1 dapat habis lebih dahulu, khususnya saat populasi dan riwayat tumbuh.

Belum ada angka pemain bersamaan yang tervalidasi. Sebelum menargetkan ribuan pemain aktif serentak, perlu uji beban terkontrol dan pengukuran CPU, latency, error, rows_read, serta rows_written. Optimasi berikutnya mencakup cache data publik terpisah dari progres pribadi, indeks dan paginasi, polling adaptif saat tab tersembunyi, dan pembagian area dunia. Menaikkan paket hosting saja tidak menghilangkan batas 12 avatar dan 100 anggota pada implementasi saat ini.
