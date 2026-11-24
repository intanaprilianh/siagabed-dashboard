# SiagaBed: Dasbor Nurse Station (v2, sedang dikerjakan)

Dasbor SiagaBed untuk ANGEL Innovation Hackathon 2026, Topik 7 *Automated Code Blue Emergency Alert System*.

> Branch ini berisi **v2**, implementasi desain Phase 3. Versi yang sedang tayang di
> https://intanaprilianh.github.io/siagabed-dashboard/ masih **Prototype Alpha** (branch `main`).

Dasbor menjalankan alur **sensor → ambang kondisi kritis → alarm**. Sinyal pad kumparan induksi magnetik (MI) di bawah sprei diolah menjadi laju napas, waktu tanpa napas efektif, kehadiran pasien, dan indeks kualitas sinyal (SQI). Mesin aturan lalu memicu Waspada dan Kritis, Pra-alarm dengan verifikasi perawat 15 detik, dan Code Blue. Tombol Code Blue manual masuk ke dasbor yang sama.

## Catatan penting

- Di mode simulasi, sinyal pad dibangkitkan model matematis di peramban. Sinyal ini bukan data pasien dan bukan hasil pengukuran pad fisik.
- Pengolahan sinyal dan mesin aturan di `js/engine.js` adalah algoritma yang dirancang untuk hub bedhead.
- Nama perawat, nama pasien, nomor rekam medis, dan nomor SEP fiktif.
- Belum diuji pada manusia dan bukan alat diagnosis.

## Isi v2

Semua layar dari desain Phase 3 (S1–S12):

- **S1 Mulai shift:** pilih shift, perawat, dan peran perangkat (nurse station, ponsel perawat, Tim Code Blue), lalu cek suara. Klik Mulai jaga sekaligus menyalakan suara.
- **S10 Ringkasan shift:** kejadian shift sebelumnya, hal yang masih terbuka, dan catatan serah terima. Catatan untuk shift berikutnya ditulis dari menu Tim.
- **S2 Bangsal:**
  - antrean "Perlu tindakan sekarang" dengan urutan Code Blue → Pra-alarm (sisa detik paling sedikit dulu) → Kritis → Waspada (belum dicek di atas yang sudah dicek) → Tidak terpantau → Perlu tindak lanjut
  - denah per kamar dengan hitungan per status, pita detail saat bed diklik, dan penghitung "x/y terpantau"
  - item yang sedang disentuh tidak bergeser; Code Blue dan Pra-alarm baru tetap naik ke atas
  - siap 24 bed: tata letak rapat satu baris per kamar
- **S3 Aksi:**
  - Panggil Code Blue sekarang
  - Batalkan Pra-alarm (tahan 2 dtk)
  - Tim sudah tiba
  - Sudah dicek
  - Di mode live, tiap aksi menampilkan status mengirim → diterima hub → gagal.
- **S4 Detail bed:** gaya monitor dengan isi berikut.
  - gelombang napas live 30 dtk dan tren laju napas
  - timer henti napas
  - alasan status
  - sinyal dan pad
  - riwayat hari ini dan identitas
  - strip alarm global untuk bed lain
- **S5 Tindak lanjut:** frasa cepat dan catatan. Catatan hanya bisa ditambah, tidak bisa diubah.
- **S6 Mode demo:** panggung alur pad → hub → aturan → keluaran, enam skenario dengan narasi.
  - Memakai ward simulasi sendiri berbingkai DEMO, jadi tidak pernah tercampur dengan data pasien.
- **S7 Ponsel perawat:** dok alarm yang menempel di semua tab, plus tab Antrean, Bangsal, dan Lainnya.
- **S8 Ponsel Tim Code Blue:** layar siaga, panggilan layar penuh, beberapa Code Blue sekaligus, keadaan terputus, dan keadaan ditutup orang lain.
- **S9 Log kejadian:**
  - filter per hari atau shift, bed, jenis, perlu tindak lanjut, dan pencarian
  - ringkasan dan waktu respons Code Blue
  - ekspor CSV
- **S11 Aturan alarm:** di menu Bantuan.
- **S12 Kontrol hub:**
  - status hub per bed
  - kalibrasi pad kosong/terisi (5 dtk)
  - cek hub
  - mode demo hub
- **Bunyi per tingkat:**
  - Waspada pelan 1×
  - Kritis tegas 1×
  - Pra-alarm dan Code Blue berulang sampai ditangani
  - Ponsel Tim Code Blue hanya berbunyi untuk Code Blue.
- **Tampilan:**
  - mode terang dan gelap
  - Tampilan ringan tanpa blur untuk PC lambat
  - 1920×1080, 1366×768, dan ponsel 390×844
  - menghormati pengaturan *reduced motion*

### Batasan yang diketahui

- Catatan tindak lanjut, "Sudah dicek", dan catatan serah terima untuk sekarang tersimpan di perangkat (localStorage). Endpoint untuk menyimpannya di `siagabed-backend` belum ada.
- Di mode simulasi, tiap tab atau perangkat menjalankan simulasinya sendiri. Supaya nurse station dan ponsel melihat kejadian yang sama, pakai mode live.
- Daftar bed live masih 8 bed tetap. Tata letak 24 bed bisa dicoba di simulasi dengan `?bed=24`.
- Mode demo baru memakai simulasi, belum hub palsu. Tombol Parameter di Kontrol hub belum aktif.

## Menjalankan secara lokal

Buka `index.html` langsung di peramban. Tidak perlu server, instalasi, atau internet; font Inter disimpan di `vendor/inter/`.

Opsi URL:
- `?langsung`: lewati Mulai shift (untuk kiosk dan uji)
- `?peran=perawat` atau `?peran=tim`: tampilan ponsel
- `?demo`: buka Mode demo
- `?bed=24`: bangsal simulasi 24 bed
- `?tema=gelap` atau `?tema=terang`: bawaannya mengikuti sistem
- `?ringan`: tanpa blur

## Struktur

- `index.html`: kerangka halaman
- `css/tokens.css`: token warna dari design system, dibuat oleh `python designs/system/build.py` (jangan diedit manual)
- `css/app.css`: gaya komponen
- `js/engine.js`: model sinyal, pengolahan sinyal, dan mesin aturan (simulasi)
- `live.js`: mode live (MQTT dan backend)
- `js/app.js`: tampilan v2
- `designs/`: mockup dan sumber design system dari Phase 3. Untuk cek kontras WCAG token, jalankan `python designs/system/kontras.py`.

## Mode live (data dari hub)

Tanpa parameter, dasbor berjalan sebagai simulasi. Dengan `?live`, dasbor membaca data dari hub SiagaBed (ESP32 asli atau hub palsu) lewat broker MQTT. Server backend dipakai untuk log hari ini, tren, dan pengiriman perintah perawat (batalkan, konfirmasi, tutup Code Blue) ke hub. Pustaka `vendor/mqtt.min.js` (MQTT.js 5.10.1, lisensi MIT) disimpan lokal supaya tetap jalan di jaringan rumah sakit tanpa internet.

Cara termudah:
1. Jalankan backend dari repo `siagabed-backend`. Folder ini harus bersebelahan dengannya.
2. Buka **http://localhost:8080/dashboard/?live=1**.
3. Dari ponsel di Wi-Fi yang sama, ganti `localhost` dengan IP komputer server.

Opsi URL:
- `&ws=ws://host:9001` (broker)
- `&api=http://host:8080` (backend)
- `&ward=melati` (bangsal)

Di mode live:
- Status bed, laju napas, dan timer henti napas datang dari hub, tertunda ±1 dtk.
- Keputusan alarm tetap di hub. Tombol aksi mengirim perintah ke hub dan tercatat di database beserta nama perawat.
- Hub yang terputus atau datanya basi lebih dari 5 dtk tampil sebagai **Tidak terpantau · hub offline**.
- Bila backend tidak berjalan, dasbor tetap menampilkan data live dan mengirim perintah langsung lewat MQTT, tetapi log hanya sejak halaman dibuka.
