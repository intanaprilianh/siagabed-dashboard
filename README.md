# SiagaBed: Dasbor Nurse Station (Prototype Alpha)

Prototype Alpha SiagaBed untuk ANGEL Innovation Hackathon 2026, Topik 7 *Automated Code Blue Emergency Alert System*.

**Buka dasbor:** https://intanaprilianh.github.io/siagabed-dashboard/

Dasbor web ini menjalankan alur **sensor → ambang kondisi kritis → alarm**. Sinyal pad kumparan induksi magnetik (MI) di bawah sprei diolah menjadi laju napas, waktu tanpa napas efektif, kehadiran pasien, dan indeks kualitas sinyal (SQI). Mesin aturan lalu memicu notifikasi Waspada dan Kritis, pra-alarm dengan verifikasi perawat 15 detik, dan aktivasi Code Blue. Tombol Code Blue manual masuk ke dasbor dan log yang sama.

## Catatan penting

- Sinyal pad dibangkitkan model matematis di peramban. Sinyal ini bukan data pasien dan bukan hasil pengukuran pad fisik.
- Pengolahan sinyal dan mesin aturan yang berjalan di halaman ini adalah algoritma yang dirancang untuk hub bedhead.
- Nama perawat, nama pasien, nomor rekam medis, dan nomor SEP fiktif.
- Belum diuji pada manusia dan bukan alat diagnosis.

## Isi dasbor

- 8 tempat tidur dalam 2 kamar KRIS, antrean pantau, dan strip "Perlu perhatian" untuk bed Waspada, Kritis, atau alarm teknis
- Grafik laju napas per bed dengan zona ambang, timer henti napas, serta sinyal pad mentah dan terfilter
- Pra-alarm dengan hitung mundur verifikasi, Code Blue otomatis, dan tombol Code Blue manual
- Log kejadian bercap waktu dengan kolom tindak lanjut
- Demo terpandu sekitar 3 menit

## Menjalankan secara lokal

Buka `index.html` langsung di peramban. Tidak perlu server atau instalasi; font dimuat dari Google Fonts bila ada koneksi internet.

## Mode live (data dari hub)

Tanpa parameter, dasbor berjalan sebagai simulasi seperti di atas. Dengan `?live`, dasbor membaca data
dari hub SiagaBed (ESP32 asli atau hub palsu) lewat broker MQTT, dan memakai server backend untuk log
hari ini, tren, serta pengiriman perintah perawat (batalkan, konfirmasi, tandai selesai) ke hub.
Kode mode live ada di `live.js`; pustaka `vendor/mqtt.min.js` (MQTT.js 5.10.1, lisensi MIT) disimpan
lokal supaya tetap jalan di jaringan rumah sakit tanpa internet.

Cara termudah: jalankan backend dari repo `siagabed-backend` (folder ini harus bersebelahan dengannya),
lalu buka **http://localhost:8080/dashboard/?live=1**. Dari ponsel di Wi-Fi yang sama, ganti
`localhost` dengan IP komputer server.

Opsi URL: `&ws=ws://host:9001` (broker), `&api=http://host:8080` (backend), `&ward=melati` (bangsal).
Mode bisa juga diganti dari menu Pengaturan → Sumber data.

Di mode live:
- status bed, laju napas, timer henti napas, dan gelombang napas datang dari hub (tertunda ±1 dtk);
- keputusan alarm tetap di hub; tombol di banner mengirim perintah ke hub dan tercatat di database
  beserta nama perawat;
- kartu simulasi menjadi **Kontrol hub** (kalibrasi pad kosong/terisi, cek hub); demo terpandu dimatikan;
- hub yang terputus tampil sebagai alarm teknis "hub offline" dan muncul di log;
- bila backend tidak berjalan, dasbor tetap menampilkan data live dan mengirim perintah langsung lewat
  MQTT, tetapi log hanya sejak halaman dibuka dan tidak tersimpan.
