"""Ronde 5 · Roll out (bagian 3): layar pendukung S9–S12, masing-masing 1 versi.

  S9  Log kejadian     terang: normal              · gelap: server log tidak tersambung
  S10 Ringkasan shift  terang: ada kejadian        · gelap: shift tanpa kejadian
  S11 Aturan alarm     terang dan gelap
  S12 Kontrol hub      terang: siap rekam pad terisi · gelap: sedang merekam (diterima hub)

Konteks waktu 11.20, Bangsal Melati 24 bed (lanjutan kejadian di S3/S5): 303-A hub offline sejak 10.49,
304-C pasien baru belum dikalibrasi, 302-B pad terlepas.
"""
import importlib.util
import pathlib

HERE = pathlib.Path(__file__).parent


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


R5B = _load("r5b", HERE.parent / "round-5b" / "build.py")
R3 = R5B.R3  # instance yang sudah berisi token demo
gly, WORD, okdot, spinner = R3.gly, R3.WORD, R3.okdot, R3.spinner
INFO, CHECK = R5B.INFO, R5B.CHECK

X_CSS = """
.pg{position:absolute;left:24px;right:24px;top:112px;bottom:24px;display:flex;flex-direction:column;gap:16px}
.phd{display:flex;align-items:flex-end;gap:12px}
.phd h1{font-size:34px;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.phd .sub{font-size:15px;color:var(--tx3);margin-top:4px}
.phd .sub b{color:var(--tx);font-weight:600}
.phd .btn{height:48px;font-size:16px}
.fbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fc{height:40px;padding:0 14px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;border:1px solid var(--hair);background:var(--glass2);white-space:nowrap}
.fc.on{background:var(--ink);color:var(--onInk);border-color:transparent}
.fc small{font-weight:500;color:var(--tx3);font-size:14px}.fc.on small{color:var(--onInk);opacity:.75}
.srch{height:40px;width:280px;border-radius:12px;border:1px solid var(--hair);background:var(--solid);display:flex;align-items:center;gap:8px;padding:0 12px;font-size:15px;color:var(--tx3)}
.xgrid{flex:1;display:grid;gap:20px;min-height:0}
.xcol{display:flex;flex-direction:column;gap:16px;min-height:0}
.xcard{border-radius:28px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;min-width:0;min-height:0;overflow:hidden}
.xh{display:flex;align-items:baseline;gap:10px}.xh h2{font-size:20px;font-weight:600}.xh span:not(.dtag){font-size:14px;color:var(--tx3)}
.xh .dtag{align-self:center}
.xt{width:100%;border-collapse:collapse;font-size:15px;table-layout:fixed}
.xt th{text-align:left;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);padding:8px 10px;border-bottom:1px solid var(--hair);white-space:nowrap}
.xt td{padding:10px;border-bottom:1px solid var(--hair);vertical-align:top;line-height:1.35}
.xt td.tm{font-feature-settings:'tnum' 1;color:var(--tx2);white-space:nowrap}
.xt td.bd{font-weight:700;font-size:17px;white-space:nowrap}
.xt td small{display:block;font-size:13px;color:var(--tx3)}
.xt .lgc{height:28px;font-size:13px}
.xt tr.grp td{padding:14px 10px 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);border-bottom:none}
.xt tr.selrow td{background:var(--hair)}
.xt tr.selrow td:first-child{box-shadow:inset 4px 0 0 var(--ink)}
.xt tr.more td{color:var(--tx2);font-size:14px}
.ev{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:9px;font-size:13px;font-weight:600;background:var(--hair);color:var(--tx);white-space:nowrap}
.ev.ok{background:var(--okSoft);color:var(--ok)}
.ev.no{background:var(--hiSoft);color:var(--hiText)}
.tag2{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:7px;font-size:12px;font-weight:600;background:var(--mdSoft);color:var(--md);margin-top:4px;white-space:nowrap}
.tln{font-size:14px;color:var(--tx);line-height:1.4}.tln small{display:block;font-size:12px;color:var(--tx3);margin-top:2px}
.tref{font-size:13px;color:var(--tx3)}
.tbtn{height:36px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;font-size:14px;font-weight:600;border:1px solid var(--hair);background:var(--glass2);white-space:nowrap}
.dis{opacity:.42}
.cbl{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:12px 0;border-top:1px solid var(--hair);font-size:14px;color:var(--tx2)}
.cbl b{font-size:17px;color:var(--tx)}.cbl .r{text-align:right;font-feature-settings:'tnum' 1}.cbl .r b{font-size:20px}
.note2{display:flex;gap:10px;font-size:13px;color:var(--tx3);line-height:1.4;align-items:flex-start}
.note2 svg{margin-top:1px;flex:none}
.cnts{display:flex;flex-wrap:wrap;gap:8px}
.banner{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:18px;background:var(--mdSoft);box-shadow:inset 0 0 0 1.5px var(--mdDot);font-size:15px;line-height:1.4}
.banner b{display:block;font-size:16px}.banner .btn{height:42px;font-size:15px;margin-left:auto}
/* S10 */
.s10{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1280px;display:grid;grid-template-columns:1fr 400px;gap:20px}
.s10 .xcard{padding:30px 32px;gap:18px;border-radius:32px}
.s10 h1{font-size:42px;font-weight:600;letter-spacing:-.03em;line-height:1.05}
.s10 .who{font-size:17px;color:var(--tx2)}.s10 .who b{color:var(--tx)}
.orow{display:grid;grid-template-columns:auto 80px 1fr auto;gap:14px;align-items:center;padding:10px 14px;border-radius:16px}
.orow b{font-size:20px;font-weight:700}.orow span{font-size:15px;color:var(--tx2)}
.orow .btn{height:44px;font-size:15px}
.quote{border-radius:18px;padding:16px 18px;font-size:16px;line-height:1.5;box-shadow:inset 4px 0 0 var(--ink)}
.quote small{display:block;font-size:13px;color:var(--tx3);margin-top:6px}
.go2{height:64px!important;font-size:19px!important}
.calm2{display:flex;align-items:center;gap:16px;padding:18px;border-radius:20px;background:var(--okSoft)}
.calm2 b{font-size:22px}.calm2 span{display:block;font-size:15px;color:var(--tx2);margin-top:2px}
.sideb .line{display:flex;align-items:center;gap:10px;font-size:16px;line-height:1.35}
.sideb .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sideb .cbd{height:70px}
.sideb .rl2{display:flex;justify-content:space-between;font-size:12px;color:var(--tx3);padding:4px 2px 2px}.sideb .rl2 b{letter-spacing:.1em;font-weight:600}
/* S11 */
.rt td:nth-child(2) b{font-weight:600}
.rt td{font-size:15px}
.bul{display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.45;color:var(--tx2)}
.bul div{display:flex;gap:10px}.bul div:before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--tx3);margin-top:9px}
.bul b{color:var(--tx)}
/* S12 */
.hbig{display:flex;align-items:center;gap:12px}.hbig b{font-size:44px;font-weight:700;letter-spacing:-.03em;line-height:1}
.kst{display:grid;grid-template-columns:32px 1fr;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:16px}
.kst .m{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;box-shadow:inset 0 0 0 2px var(--hair);color:var(--tx3)}
.kst.done .m{background:var(--ok);box-shadow:none;color:#fff}
.kst.cur{background:var(--hair)}.kst.cur .m{background:var(--ink);color:var(--onInk);box-shadow:none}
.kst b{display:block;font-size:17px;font-weight:600}.kst small{display:block;font-size:14px;color:var(--tx3);margin-top:2px;line-height:1.35}
.kst.next b{color:var(--tx2);font-weight:500}
.pbar{height:10px;border-radius:5px;background:var(--glass2);margin-top:8px;overflow:hidden}.pbar i{display:block;height:100%;border-radius:5px;background:var(--ok)}
.bigbtn{height:60px!important;font-size:18px!important;width:100%}
.onl{display:inline-flex;align-items:center;gap:6px;font-weight:600}
"""


def chip(cls, text=None):
    return f'<span class="lgc s-{cls}">{gly(cls, 14)}{text or WORD[cls]}</span>'


def counts(d):
    out = []
    for c in ("cb", "pra", "kr", "ws", "tk"):
        n = d.get(c, 0)
        z = " zero" if n == 0 else ""
        g = gly(c, 14)
        if n == 0 and c == "cb":
            g = R3.siren("var(--tx3)", 16)
        elif n == 0 and c == "pra":
            g = R3.oct_("var(--tx3)", "var(--bg)", 16)
        elif n == 0 and c == "kr":
            g = R3.tri("var(--tx3)", 15)
        out.append(f'<span class="lgc s-{c}{z}">{g}<span class="n">{n}</span>{WORD[c]}</span>')
    return '<div class="cnts">' + "".join(out) + "</div>"


def nav(active, **kw):
    t = R3.topbar(**kw)
    return t.replace('<a class="on">Bangsal</a>', "<a>Bangsal</a>").replace(f"<a>{active}</a>", f'<a class="on">{active}</a>', 1)


HUB24 = '<span class="mdot"></span><b>Live</b> · 23/24 hub'


def top24(active):
    return nav(active, hub=HUB24, terp="21/24", clock="11.20", hubwarn=True)


# ------------------------------------------------------------------ S9 · Log kejadian
def ev(t, cls=""):
    return f'<span class="ev {cls}">{t}</span>'


def tl(text, by):
    return f'<div class="tln">{text}<small>{by}</small></div>'


def s9(mode, down=False):
    tbtn = f'<span class="tbtn{" dis" if down else ""}">Tulis tindak lanjut</span>'
    rows = [
        ("11.19.02", "303-A", ev("Cek hub", "no"), "Ditolak: hub offline", "Teknisi Arif", ""),
        ("11.18.05", "304-C", ev("Kalibrasi kosong", "ok"), "Pad kosong direkam 5 dtk<small>diterima hub</small>", "Teknisi Arif", ""),
        ("10.54.03", "302-C", ev("Sudah dicek", "ok"), "Kritis · RR 31 /mnt<small>diterima hub</small>", "Ns. Rina", tl("Nebulisasi ulang, posisi semi-Fowler.", "Ns. Rina · 10.54")),
        ("10.53.18", "301-B", ev("Dibatalkan"), "Pra-alarm dibatalkan di bedhead", "Ns. Rina · bedhead", tbtn),
        ("10.53.07", "301-B", chip("pra"), "20 dtk tanpa napas efektif<small>verifikasi 15 dtk</small>", "hub", '<span class="tref">lihat 10.53.18</span>'),
        ("10.53.00", "305-B", ev("Tim sudah tiba", "ok"), "Code Blue ditutup<small>respons 1 mnt 12 dtk</small>", "dr. Yoga · ponsel tim",
         tl("Ventilasi bag-mask ± 1 mnt oleh tim, napas spontan kembali 10.54. DPJP dihubungi 10.57, persiapan pindah ke ICU.", "Ns. Rina · 10.58")),
        ("10.51.48", "305-B", chip("cb"), "Tombol manual di kamar", "tombol kamar", '<span class="tref">lihat 10.53.00</span>'),
        ("10.51.40", "302-C", chip("kr"), "RR ≥ 30 selama 1 mnt", "hub", '<span class="tref">lihat 10.54.03</span>'),
        ("10.51.02", "302-B", chip("tk"), "Pad terlepas<small>periksa konektor di bedhead</small>", "hub", ""),
        ("10.49.30", "303-A", chip("tk", "Hub offline"), "Putus mendadak", "hub", ""),
        ("10.48.20", "306-B", chip("away"), "Pasien turun · tidak dibunyikan", 'hub<br><span class="tag2">terlambat diterima 10.48.31</span>', ""),
        ("10.44.10", "302-C", chip("ws"), "RR > 20 selama 2 mnt", "hub", ""),
    ]
    trs = "".join(f'<tr><td class="tm">{a}</td><td class="bd">{b}</td><td>{c}</td><td>{d}</td><td>{e}</td><td>{f}</td></tr>' for a, b, c, d, e, f in rows)
    table = f"""<table class="xt"><colgroup><col style="width:96px"><col style="width:78px"><col style="width:176px"><col><col style="width:190px"><col style="width:380px"></colgroup>
<tr><th>Waktu</th><th>Bed</th><th>Kejadian</th><th>Rincian</th><th>Oleh</th><th>Tindak lanjut</th></tr>{trs}</table>"""
    banner = ""
    if down:
        banner = (f'<div class="banner">{R3.warn_ic(s=22)}<div><b>Server log tidak tersambung</b>Menampilkan data yang sudah dimuat sampai 11.19. '
                  f'Ekspor CSV dan menulis tindak lanjut dimatikan sementara. Alarm tetap berjalan di hub dan nurse station.</div><span class="btn ghost">Coba lagi</span></div>')
    exp = f'<span class="btn ink{" dis" if down else ""}">Ekspor CSV</span>'
    body = f"""{top24("Log")}<div class="pg">
  <div class="phd"><div><h1>Log kejadian</h1><div class="sub">Bangsal Melati · Lantai 3 · hanya bisa ditambah, tidak bisa diubah atau dihapus</div></div><span class="sp"></span>{exp}</div>
  {banner}
  <div class="fbar"><span class="fc on">Hari ini <small>23 Nov</small></span><span class="fc">Shift pagi</span><span class="fc">Semua bed ▾</span><span class="fc">Semua jenis ▾</span>
    <span class="fc">Perlu tindak lanjut <small>2</small></span><span class="sp"></span><span class="srch">⌕ Cari bed atau perawat</span></div>
  <div class="xgrid" style="grid-template-columns:1fr 440px">
    <section class="xcard glass">{table}</section>
    <div class="xcol">
      <section class="xcard glass"><div class="xh"><h2>Hari ini</h2><span>sejak 07.00</span></div>{counts({"cb": 1, "pra": 1, "kr": 1, "ws": 2, "tk": 3})}</section>
      <section class="xcard glass"><div class="xh"><h2>Code Blue</h2><span>7 hari terakhir</span></div>
        <div class="cbl"><span><b>305-B</b> · 23 Nov 10.51<br>tombol manual · tindak lanjut ✓</span><span class="r">respons<br><b>1:12</b></span></div>
        <div class="cbl"><span><b>304-B</b> · 21 Nov 03.14<br>otomatis · tindak lanjut ✓</span><span class="r">respons<br><b>2:05</b></span></div>
        <div class="cbl"><span><b>302-A</b> · 19 Nov 22.40<br>verifikasi perawat · tindak lanjut ✓</span><span class="r">respons<br><b>1:38</b></span></div>
        <div class="note2">Median waktu respons 1 mnt 38 dtk (3 kejadian). Waktu respons = Code Blue sampai "Tim sudah tiba".</div></section>
      <div class="note2" style="padding:0 6px">{INFO}<span>CSV berisi No. RM dan nama perawat. Simpan sesuai kebijakan rekam medis rumah sakit.</span></div>
    </div>
  </div>
</div>"""
    return R3.doc(f"S9 · Log kejadian · {mode}", R3.css(R5B.BASE5B, X_CSS), body, mode)


# ------------------------------------------------------------------ S10 · Ringkasan shift
B8_S10 = [("301-A", "ok", "", "RR 15"), ("301-B", "ok", "", "RR 14"), ("301-C", "ok", "", "RR 19"), ("301-D", "empty", "", "siap pakai"),
          ("302-A", "ok", "", "RR 13"), ("302-B", "tk", "1", "pad terlepas"), ("302-C", "ok", "", "RR 20"), ("302-D", "ok", "", "RR 18")]
B8_S10_CALM = [b if b[0] != "302-B" else ("302-B", "ok", "", "RR 17") for b in B8_S10]


def side_now(beds, terp):
    rooms = ""
    for i, name in enumerate(("301", "302")):
        bs = beds[i * 4:(i + 1) * 4]
        n = sum(1 for b in bs if b[1] != "empty")
        rooms += f'<div class="rl2"><b>KAMAR {name}</b><span>{n} pasien</span></div><div class="g2">' + "".join(R3.tile(b, dense=True) for b in bs) + "</div>"
    return f"""<section class="xcard glass sideb"><div class="k">Bangsal sekarang · 07.01</div>
  <div class="line"><span class="dot"></span><b>8 hub</b>&nbsp;terhubung · Live</div>
  <div class="line"><b style="font-size:28px">{terp}</b>&nbsp;bed terpantau</div>{rooms}</section>"""


def s10(mode, calm=False):
    if calm:
        main = f"""<div class="calm2">{R3.CHECK}<div><b>Shift malam tanpa kejadian</b><span>Semua bed terpantau sepanjang shift. Tidak ada item yang masih terbuka.</span></div></div>
  <div><div class="k" style="margin-bottom:10px">Kejadian semalam</div>{counts({})}</div>
  <div><div class="k" style="margin-bottom:10px">Catatan dari Ns. Dewi</div><div class="quote glass2">Tidak ada catatan khusus. 301-D masih kosong, siap pakai.<small>Ditulis 06.52</small></div></div>"""
        beds, terp = B8_S10_CALM, "8/8"
    else:
        rows = [
            (R3.off(s=16), "302-B", "Tidak terpantau · pad terlepas sejak 06.41", '<span class="btn ghost">Buka detail</span>'),
            (R3.circ(s=16), "301-C", "Waspada 04.12 · tindak lanjut belum ditulis", '<span class="btn ink">Tulis tindak lanjut</span>'),
            (R3.circ(s=16), "302-C", "Waspada 05.40 · tindak lanjut belum ditulis", '<span class="btn ink">Tulis tindak lanjut</span>'),
        ]
        orows = "".join(f'<div class="orow glass2">{g}<b>{b}</b><span>{t}</span>{a}</div>' for g, b, t, a in rows)
        main = f"""<div><div class="k" style="margin-bottom:10px">Kejadian semalam</div>{counts({"pra": 1, "ws": 3, "tk": 2})}
    <div style="font-size:15px;color:var(--tx2);margin-top:10px">Pra-alarm 1×: <b style="color:var(--tx)">301-B 02.17</b>, dibatalkan di bedhead setelah dicek Ns. Dewi.</div></div>
  <div><div class="k" style="margin-bottom:10px">Masih terbuka · 3</div><div style="display:flex;flex-direction:column;gap:8px">{orows}</div></div>
  <div><div class="k" style="margin-bottom:10px">Catatan dari Ns. Dewi</div><div class="quote glass2">302-C sesak bertambah menjelang pagi, RR naik dari 18 ke 23. Mohon dipantau; DPJP visite jam 08.00.<small>Ditulis 06.52</small></div></div>"""
        beds, terp = B8_S10, "7/8"
    body = f"""<div class="s10">
  <section class="xcard glass">
    <div><div class="k">Serah terima · Senin, 23 Nov 2026 · 07.01</div><h1 style="margin-top:6px">Ringkasan shift malam</h1>
      <div class="who" style="margin-top:6px">21.00–07.00 · <b>Ns. Dewi</b> → <b>Ns. Rina</b></div></div>
    {main}
    <div style="display:flex;gap:10px;align-items:center"><span class="btn ink go2" style="flex:1">Lanjut ke Bangsal</span><span class="btn ghost go2">Lihat log semalam</span></div>
  </section>
  {side_now(beds, terp)}
</div>"""
    return R3.doc(f"S10 · Ringkasan shift · {mode}", R3.css(R5B.BASE5B, X_CSS), body, mode)


# ------------------------------------------------------------------ S11 · Aturan alarm
RULES = [
    ("cb", "Pra-alarm tidak diverifikasi dalam <b>15 dtk</b>, atau tombol manual di kamar ditekan",
     "Bunyi berulang · ponsel Tim Code Blue berbunyi · lampu dan buzzer nurse station menyala",
     "Tim menuju bed dan menekan <b>Tim sudah tiba</b> saat sampai. Waktu respons tercatat."),
    ("pra", "<b>≥ 20 dtk</b> tanpa napas efektif",
     "Bunyi berulang · ponsel perawat berbunyi · bedhead meminta verifikasi · hitung mundur 15 dtk",
     "Cek pasien. Bila baik, <b>Batalkan</b> (tahan 2 dtk) di dasbor, ponsel, atau bedhead. Bila tidak, <b>Panggil Code Blue</b>."),
    ("kr", "RR <b>≤ 8</b> atau <b>≥ 30</b> /mnt selama 1 mnt", "Bunyi 1× tegas · item merah penuh di antrean",
     "Cek pasien, tekan <b>Sudah dicek</b>, lalu tulis tindak lanjut."),
    ("ws", "RR <b>≤ 10</b> atau <b>> 20</b> /mnt selama 2 mnt", "Bunyi 1× pelan", "Cek saat sempat, lalu <b>Sudah dicek</b>."),
    ("tk", "Pad terlepas, hub offline, data basi <b>> 5 dtk</b>, atau belum dikalibrasi", "Tanpa bunyi klinis · penyebab ditulis di item",
     "Ikuti langkah di item, misalnya periksa konektor atau daya hub."),
    ("away", "Pasien turun dari bed, atau sinyal <b>ditahan</b> karena gerak", "Diam · tetap terlihat di denah", "Tidak perlu tindakan kecuali berlangsung lama."),
]


def s11(mode):
    trs = "".join(f'<tr><td>{chip(c)}</td><td>{a}</td><td>{b}</td><td>{d}</td></tr>' for c, a, b, d in RULES)
    table = f"""<table class="xt rt"><colgroup><col style="width:190px"><col style="width:300px"><col><col style="width:380px"></colgroup>
<tr><th>Tingkat</th><th>Kapan</th><th>Yang terjadi</th><th>Yang perlu dilakukan</th></tr>{trs}</table>"""
    body = f"""{nav("Bantuan", clock="11.40", terp="8/8")}<div class="pg">
  <div class="phd"><div><h1>Aturan alarm</h1><div class="sub">Kapan dan kenapa SiagaBed berbunyi · berlaku di semua bed</div></div><span class="sp"></span><span class="btn ink">Tutup</span></div>
  <div class="xgrid" style="grid-template-columns:1fr 500px">
    <section class="xcard glass">{table}</section>
    <div class="xcol">
      <section class="xcard glass"><div class="xh"><h2>Hal penting</h2></div><div class="bul">
        <div><span><b>Hub yang memutuskan</b> alarm; dasbor menjelaskan alasannya.</span></div>
        <div><span>Gasping yang jarang <b>tidak menghentikan</b> hitung mundur Pra-alarm.</span></div>
        <div><span>Pra-alarm hanya berhenti oleh perawat, atau oleh napas efektif dengan sinyal andal.</span></div>
        <div><span>Ponsel hanya berbunyi saat halaman SiagaBed terbuka.</span></div>
        <div><span>Ambang alarm tidak bisa diubah dari layar perawat.</span></div></div></section>
      <section class="xcard glass"><div class="xh"><h2>Batasan alat</h2></div><div class="bul">
        <div><span><b>Bukan alat diagnosis</b> dan belum diuji pada manusia.</span></div>
        <div><span>Memantau napas pasien dewasa di rawat inap non-ICU, tanpa kontak.</span></div>
        <div><span>Tidak mengukur SpO₂ maupun detak jantung.</span></div></div></section>
      <section class="xcard glass"><div class="xh"><span class="dtag">DEMO · data fiktif</span><h2>Mode demo</h2></div>
        <div style="font-size:15px;line-height:1.45;color:var(--tx2)">Dipakai untuk pelatihan dan Demo Day. Selalu berlabel DEMO dengan bingkai ungu, dan datanya tidak pernah tercampur dengan data pasien.</div></section>
    </div>
  </div>
</div>"""
    return R3.doc(f"S11 · Aturan alarm · {mode}", R3.css(R5B.BASE5B, X_CSS), body, mode)


# ------------------------------------------------------------------ S12 · Kontrol hub
def s12(mode, recording=False):
    online = f'<span class="onl">{okdot()}Online</span><small>fw 0.3.2</small>'
    rows_att = [
        ("303-A", f'<span class="onl" style="color:var(--lo)">{R3.off(s=14)}Offline</span><small>putus mendadak 10.49</small>', "—", "20 Nov", "31 mnt lalu",
         '<span class="ev no">Cek hub · ditolak</span><small>hub offline · 11.19</small>', False),
        ("304-C", online, "Terpasang · SQI 0,90", chip("tk", "Belum dikalibrasi"), "1 dtk",
         '<span class="ev ok">Kalibrasi kosong · diterima</span><small>11.18</small>', True),
        ("302-B", online, chip("tk", "Pad terlepas"), "20 Nov", "1 dtk", "—", False),
    ]
    rows_ok = [("301-A", "0,93", "20 Nov", '<span class="ev ok">Cek hub · diterima</span><small>10.40</small>'), ("301-B", "0,91", "20 Nov", "—"),
               ("301-C", "0,88", "20 Nov", "—"), ("302-A", "0,92", "21 Nov", "—"), ("302-C", "0,90", "20 Nov", "—"), ("302-D", "0,89", "20 Nov", "—")]
    trs = '<tr class="grp"><td colspan="6">Perlu perhatian · 3</td></tr>'
    for bed, hub, pad, cal, last, cmd, sel in rows_att:
        trs += f'<tr{" class=selrow" if sel else ""}><td class="bd">{bed}</td><td>{hub}</td><td>{pad}</td><td>{cal}</td><td class="tm">{last}</td><td>{cmd}</td></tr>'
    trs += '<tr class="grp"><td colspan="6">Normal · 21 hub</td></tr>'
    for bed, sqi, cal, cmd in rows_ok:
        trs += f'<tr><td class="bd">{bed}</td><td>{online}</td><td>Terpasang · SQI {sqi}</td><td>{cal}</td><td class="tm">1 dtk</td><td>{cmd}</td></tr>'
    trs += '<tr class="more"><td colspan="6">15 hub lain online dan terkalibrasi · Tampilkan semua</td></tr>'
    table = f"""<table class="xt"><colgroup><col style="width:84px"><col style="width:170px"><col style="width:220px"><col style="width:190px"><col style="width:110px"><col></colgroup>
<tr><th>Bed</th><th>Hub</th><th>Pad dan sinyal</th><th>Kalibrasi</th><th>Data</th><th>Perintah terakhir</th></tr>{trs}</table>"""
    if recording:
        step2 = (f'<div class="kst cur"><span class="m">2</span><div><b>Rekam pad terisi · 5 dtk</b><small>Diterima hub 11.20.14 · merekam, pasien tetap berbaring tenang</small>'
                 f'<div class="pbar"><i style="width:40%"></i></div><small>3 dtk lagi</small></div></div>')
        btn = f'<span class="btn sending bigbtn">{spinner("var(--tx2)")}Merekam… 3 dtk</span>'
    else:
        step2 = '<div class="kst cur"><span class="m">2</span><div><b>Rekam pad terisi · 5 dtk</b><small>Minta pasien berbaring tenang di tengah bed, lalu tekan Rekam.</small></div></div>'
        btn = '<span class="btn ink bigbtn">Rekam pad terisi · 5 dtk</span>'
    panel = f"""<section class="xcard glass" style="gap:14px">
  <div class="k">Kalibrasi bed terpilih</div>
  <div class="hbig"><b>304-C</b>{chip("tk", "Belum dikalibrasi")}</div>
  <div style="font-size:15px;color:var(--tx2)">Tn. E.P. · 58 · Pneumonia · masuk 10.40<br>Hub 304-C · fw 0.3.2 · online</div>
  <div class="kst done"><span class="m">{CHECK}</span><div><b>Rekam pad kosong · 5 dtk</b><small>Selesai 11.18.05 · diterima hub</small></div></div>
  {step2}
  <div class="kst next"><span class="m">3</span><div><b>Hub mulai memantau</b><small>Status bed berubah dari Tidak terpantau ke Normal</small></div></div>
  <div class="note2">{INFO}<span>Selama belum dikalibrasi, hub menganggap pasien selalu ada. Setiap perintah menampilkan mengirim → diterima → ditolak.</span></div>
  <div style="margin-top:auto">{btn}</div>
</section>"""
    body = f"""{top24("Tim")}<div class="pg">
  <div class="phd"><div><h1>Kontrol hub</h1><div class="sub">Khusus tim SiagaBed · Bangsal Melati · 24 hub · perintah atas nama <b>Teknisi Arif</b> · <u>ganti</u></div></div><span class="sp"></span>
    <span class="btn ghost">Cek semua hub</span><span class="btn ghost">Mode demo hub · mati</span><span class="btn ghost">Parameter</span></div>
  <div class="fbar"><span class="fc">Semua <small>24</small></span><span class="fc on">Perlu perhatian <small>3</small></span><span class="fc">Offline <small>1</small></span><span class="fc">Belum dikalibrasi <small>1</small></span></div>
  <div class="xgrid" style="grid-template-columns:1fr 560px">
    <section class="xcard glass">{table}</section>
    {panel}
  </div>
</div>"""
    return R3.doc(f"S12 · Kontrol hub · {mode}", R3.css(R5B.BASE5B, X_CSS), body, mode)


FRAMES = [
    ("s9-light", lambda: s9("light")), ("s9-dark", lambda: s9("dark", down=True)),
    ("s10-light", lambda: s10("light")), ("s10-dark", lambda: s10("dark", calm=True)),
    ("s11-light", lambda: s11("light")), ("s11-dark", lambda: s11("dark")),
    ("s12-light", lambda: s12("light")), ("s12-dark", lambda: s12("dark", recording=True)),
]

if __name__ == "__main__":
    for name, fn in FRAMES:
        (HERE / f"{name}.html").write_text(fn(), encoding="utf-8")
        print("wrote", name)
