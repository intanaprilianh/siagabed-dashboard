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
