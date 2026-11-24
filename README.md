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

## Isi v2 sejauh ini

- **Bangsal (S2):**
  - antrean "Perlu tindakan sekarang" dengan urutan Code Blue → Pra-alarm (sisa detik paling sedikit dulu) → Kritis → Waspada (belum dicek di atas yang sudah dicek) → Tidak terpantau → Perlu tindak lanjut
  - denah per kamar dengan hitungan per status, pita detail saat bed diklik, dan penghitung "x/y terpantau"
  - item yang sedang disentuh tidak bergeser; Code Blue dan Pra-alarm baru tetap naik ke atas
- **Aksi:**
  - Panggil Code Blue sekarang
  - Batalkan Pra-alarm (tahan 2 dtk)
  - Tim sudah tiba
  - Sudah dicek
  - Di mode live, tiap aksi menampilkan status mengirim → diterima hub → gagal.
- **Tindak lanjut (S5):** frasa cepat dan catatan. Catatan hanya bisa ditambah; untuk sekarang tersimpan di perangkat ini.
- **Bunyi per tingkat:**
  - Waspada pelan 1×
  - Kritis tegas 1×
  - Pra-alarm dan Code Blue berulang sampai ditangani
- **Tampilan:**
  - Mode terang dan gelap, Tampilan ringan tanpa blur untuk PC lambat
  - Ukuran layar 1920×1080 dan 1366×768
  - Menghormati pengaturan *reduced motion*
- **Menu Tim (sementara):** skenario simulasi, waktu tahan singkat untuk latihan, tema, dan perawat jaga.

Menyusul: Mulai shift (S1), Detail bed (S4), Mode demo (S6), ponsel perawat dan Tim Code Blue (S7, S8), Log (S9), Ringkasan shift (S10), Aturan alarm (S11), dan Kontrol hub (S12).

## Menjalankan secara lokal

Buka `index.html` langsung di peramban. Tidak perlu server, instalasi, atau internet; font Inter disimpan di `vendor/inter/`.

Opsi URL tampilan:
- `?tema=gelap` atau `?tema=terang` (bawaan: mengikuti sistem)
- `?ringan` (tanpa blur)

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
