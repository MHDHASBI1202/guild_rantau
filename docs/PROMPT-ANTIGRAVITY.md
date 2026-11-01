# Prompt agar perubahan Antigravity tetap fokus

Salin instruksi berikut sebelum memberikan tugas. Ganti bagian dalam kurung siku.

```text
Tugas saya: [jelaskan fitur atau masalah yang ingin diperbaiki].
Hasil yang diharapkan: [contoh perilaku atau tampilan yang benar].

Kerjakan berdasarkan versi terbaru di folder D:\konten\guild-rantau\github-export.
Baca git status, git diff, dan commit terbaru sebelum mengedit. Pertahankan perubahan yang sudah ada.

Batas pekerjaan:
1. Cari penyebab dan identifikasi file yang berhubungan langsung. Jelaskan rencana singkat, lalu kerjakan.
2. Ubah fitur yang diminta dan dependensi yang benar-benar diperlukan untuk membuatnya berfungsi.
3. Jangan melakukan refactor besar, mengganti arsitektur, memformat seluruh file, menambah library, atau mengganti desain halaman lain tanpa kebutuhan langsung.
4. Jangan menyalin seluruh file dari versi lama, backup, atau contoh internet. Bandingkan dan gabungkan perubahan kecil agar fitur baru dan perbaikan lama tetap ada.
5. Pertahankan login Google, data/progres pemain, katalog dan kunci kosmetik, barter, milestone, serta animasi yang sudah bekerja. Jangan mengubah API, schema database, atau konfigurasi hosting untuk tugas tampilan kecuali memang diperlukan dan sudah dijelaskan.
6. Jika menemukan masalah lain yang tidak menghalangi tugas ini, catat terpisah. Jangan diam-diam memasukkannya ke pekerjaan. Jika perlu memperluas lingkup, jelaskan alasannya dan minta persetujuan.
7. Uji bagian yang diubah dan dampaknya pada fitur terkait. Untuk tampilan, cek HP kecil, HP biasa, tablet, dan PC; pastikan tidak ada scroll horizontal, tombol tertutup, atau preview terpotong.
8. Jangan menghapus atau melemahkan tes agar hasil terlihat lolos. Bedakan kegagalan yang sudah ada sebelum tugas dengan kegagalan akibat perubahanmu.
9. Sebelum commit, periksa git diff sekali lagi. Hapus perubahan yang tidak berhubungan dengan tugas ini.
10. Laporkan hasil akhir: apa yang berubah, file yang diubah beserta alasannya, pengujian yang dijalankan, dan batasan yang masih ada. Jangan menyebut fitur sudah diuji jika belum diuji.

Untuk tugas ini, persetujuan deploy: [hanya preview lokal / deploy setelah tes lolos].
```

Contoh tugas yang spesifik:

> Rapikan header Guild Rantau pada layar 320–430 px. Counter pemain, jam, tombol siang/malam, dan tombol Karakterku harus tetap terlihat tanpa saling menutupi. Pertahankan layout PC dan semua logika login serta gameplay. Perubahan cukup pada komponen header dan CSS yang berkaitan. Tunjukkan preview HP dan PC sebelum deploy.

Prompt ini membantu membatasi pekerjaan; tetap periksa diff sebelum menerima atau menerbitkan hasilnya.
