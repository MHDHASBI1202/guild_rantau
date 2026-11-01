# Verifikasi desain karakter dan layout — 2 November 2026

Lingkup: sambungan model/avatar, penampilan kosmetik, pose memegang alat, dependensi animasi kerja, dan layout responsif. Fitur barter, milestone, login, data pemain, animasi ambient, serta rutinitas idle dipertahankan.

## Lolos

- TypeScript `tsc --noEmit`.
- `test-avatar-models.mjs`: 12 kombinasi peran/warna, ukuran model, lantai, dan gerak jalan.
- `test-character-fitting.mjs`: 1.680 kombinasi gender, rambut, peran, topi, dan kacamata.
- `test-hair-collisions.mjs`: 2.940 kombinasi dengan uji potongan permukaan pada pose jalan yang disampel; tidak ada perpotongan rambut yang ditemukan.
- `test-equipment-contact.mjs`: sambungan pergelangan, jahitan jubah tetap, target tangan enam peran, kontak palu, reduced motion, kosmetik barter, serta efek kerja yang tidak muncul saat idle.
- `test-google-auth.mjs`: validasi token dan cookie dengan kunci uji lokal. Bukan pengujian login akun Google nyata.
- Pemeriksaan browser lokal pada lebar 320, 390, 768, dan 1440 piksel: halaman dunia/lemari, header, navigasi, dan panel karakter; tidak ditemukan overflow horizontal pada keadaan yang diperiksa.

## Temuan navigasi yang masih terbuka

`test-activity-animation.mjs` sudah disesuaikan untuk mengambil `.root` dari API lingkungan terbaru. Bagian pemeriksaan jalur belum lolos: contoh start ke-5 untuk tugas kayu berada sekitar `[-6.87, -5.89]`, di dalam area kolam yang sudah ditambahkan sebelumnya. Lingkar jalan dan posisi kolam berasal dari kode navigasi/lingkungan versi sebelum revisi ini. Perubahan sambungan tangan dan layout tidak memperbaiki perencanaan jalur tersebut.

Masalah navigasi dicatat terpisah agar tidak mengubah perilaku perjalanan dunia secara luas dalam revisi desain ini. Jangan menghapus pemeriksaan tabrakan untuk membuat tes terlihat lolos. Perbaikan berikutnya perlu menangani titik awal, jalur pergi/pulang, dan jalan santai di sekitar kolam serta objek lingkungan, bukan hanya perjalanan satu aktivitas.
