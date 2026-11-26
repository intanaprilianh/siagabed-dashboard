"""Ronde 4 · Design system SiagaBed (dikunci dari C″).

Output:
  tokens.css     token CSS (nama semantik) untuk implementasi, mode terang default + gelap
  tokens.json    token yang sama untuk dibuat sebagai variabel Figma
  fondasi.html   lembar fondasi: warna, tipografi, jarak, radius, elevasi, ikon, aturan status
  komponen.html  lembar komponen; tiap spesimen punya kelas c-* untuk diimpor per kelompok

Nilai warna diambil dari designs/round-3/build.py (TOKENS), lalu diberi nama semantik.
"""
import importlib.util
import json
import pathlib
import re

HERE = pathlib.Path(__file__).parent
_spec = importlib.util.spec_from_file_location("r3", HERE.parent / "round-3" / "build.py")
R3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R3)


def parse(block):
    return dict(re.findall(r"--([A-Za-z0-9]+):([^;]+);", block))


RAW = {m: parse(R3.TOKENS[m]) for m in ("light", "dark")}
for m in RAW:
    RAW[m]["onHi"] = "#FFFFFF"
# Ronde 5: token mode demo (disetujui pengguna 23 Nov 2026), ungu pekat khusus data fiktif
DEMO = {"light": {"demo": "#6232D5", "demoText": "#5426C8", "demoSoft": "rgba(98,50,213,.10)", "demoEdge": "rgba(98,50,213,.45)"},
        "dark": {"demo": "#7C4DFF", "demoText": "#C4B2FF", "demoSoft": "rgba(124,77,255,.16)", "demoEdge": "rgba(160,130,255,.55)"}}
for m in RAW:
    RAW[m].update(DEMO[m])

# nama lama -> (nama semantik, peran, scope Figma)
MAP = [
    ("bg", "color/canvas/base", "Kanvas halaman (bawah gradasi)", "FRAME_FILL"),
    ("bgTop", "color/canvas/top", "Kanvas halaman (atas gradasi)", "FRAME_FILL"),
    ("glowA", "color/canvas/glow-a", "Cahaya latar biru", "FRAME_FILL"),
    ("glowB", "color/canvas/glow-b", "Cahaya latar toska", "FRAME_FILL"),
    ("glowC", "color/canvas/glow-c", "Cahaya latar merah lembut", "FRAME_FILL"),
    ("glass", "color/surface/glass", "Panel kaca (bilah atas, panel denah)", "FRAME_FILL"),
    ("glass2", "color/surface/glass-strong", "Kaca tebal: tile, item antrean, pil", "FRAME_FILL"),
    ("solid", "color/surface/solid", "Permukaan solid (tampilan ringan, popover)", "FRAME_FILL"),
    ("solidA", "color/surface/solid-muted", "Panel solid (tampilan ringan)", "FRAME_FILL"),
    ("edge", "color/border/edge", "Tepi kaca", "STROKE_COLOR"),
    ("hair", "color/border/hair", "Garis tipis, isi chip netral, skeleton", "STROKE_COLOR,FRAME_FILL,SHAPE_FILL"),
    ("tx", "color/text/primary", "Teks utama", "TEXT_FILL"),
    ("tx2", "color/text/secondary", "Teks pendukung", "TEXT_FILL"),
    ("tx3", "color/text/tertiary", "Keterangan, label kecil", "TEXT_FILL"),
    ("hi", "color/alarm/high", "Prioritas tinggi: Kritis penuh, garis Pra-alarm, tombol Panggil Code Blue", "FRAME_FILL,SHAPE_FILL,STROKE_COLOR"),
    ("hiText", "color/alarm/high-text", "Teks merah di atas permukaan terang/gelap", "TEXT_FILL,SHAPE_FILL"),
    ("hiSoft", "color/alarm/high-soft", "Isi bening Pra-alarm", "FRAME_FILL"),
    ("hiEdge", "color/alarm/high-edge", "Garis merah tipis (pita detail Kritis)", "STROKE_COLOR"),
    ("cbBg", "color/alarm/codeblue", "Code Blue: merah tua + bingkai putih", "FRAME_FILL,SHAPE_FILL"),
    ("onHi", "color/alarm/on-alarm", "Teks/ikon/bingkai putih di atas merah", "TEXT_FILL,SHAPE_FILL,FRAME_FILL,STROKE_COLOR"),
    ("md", "color/alarm/medium-text", "Teks Waspada", "TEXT_FILL"),
    ("mdDot", "color/alarm/medium", "Garis dan badge Waspada", "FRAME_FILL,SHAPE_FILL,STROKE_COLOR"),
    ("mdSoft", "color/alarm/medium-soft", "Isi Waspada", "FRAME_FILL"),
    ("lo", "color/status/unmonitored", "Tidak terpantau: teks, garis putus", "TEXT_FILL,SHAPE_FILL,STROKE_COLOR,FRAME_FILL"),
    ("loSoft", "color/status/unmonitored-soft", "Isi Tidak terpantau", "FRAME_FILL"),
    ("hatch", "color/status/unmonitored-hatch", "Arsir Tidak terpantau", "FRAME_FILL,SHAPE_FILL"),
    ("ok", "color/status/normal", "Normal: titik dan teks", "TEXT_FILL,SHAPE_FILL"),
    ("okSoft", "color/status/normal-soft", "Isi ikon centang", "SHAPE_FILL,FRAME_FILL"),
    ("ink", "color/action/ink", "Tombol utama netral (Sudah dicek), badge urutan", "FRAME_FILL,SHAPE_FILL"),
    ("onInk", "color/action/on-ink", "Teks di atas ink", "TEXT_FILL"),
    ("pillOn", "color/action/pill-on", "Nav aktif", "FRAME_FILL"),
    ("pillOnTx", "color/action/pill-on-text", "Teks nav aktif", "TEXT_FILL"),
    ("focus", "color/focus/ring", "Cincin fokus keyboard", "STROKE_COLOR,FRAME_FILL"),
    ("sel", "color/focus/selected", "Cincin bed terpilih", "STROKE_COLOR,FRAME_FILL"),
    ("demo", "color/demo/base", "Mode demo: bingkai layar, tab DEMO, pil sumber, langkah aktif", "FRAME_FILL,SHAPE_FILL,STROKE_COLOR"),
    ("demoText", "color/demo/text", "Mode demo: teks ungu (label langkah, judul alur)", "TEXT_FILL,SHAPE_FILL"),
    ("demoSoft", "color/demo/soft", "Mode demo: isi langkah aktif", "FRAME_FILL"),
    ("demoEdge", "color/demo/edge", "Mode demo: garis panel dan pita", "STROKE_COLOR"),
]

SPACE = [("space/1", 4), ("space/2", 8), ("space/3", 12), ("space/4", 16), ("space/5", 20), ("space/6", 24), ("space/8", 32)]
RADIUS = [("radius/chip", 10), ("radius/tile-rapat", 12), ("radius/tile", 16), ("radius/pita", 18), ("radius/kamar", 22),
          ("radius/baris", 24), ("radius/kartu", 28), ("radius/panel", 32), ("radius/pil", 999)]

TYPE = [  # nama, ukuran, berat, line-height %, tracking %, contoh, catatan
    ("Bed/Hero", 120, "Bold", 85, -5, "301-B", "Nomor bed item antrean teratas"),
    ("Bed/Baris", 40, "Semi Bold", 100, -3.5, "302-C", "Nomor bed di baris antrean"),
    ("Bed/Tile", 24, "Bold", 100, -2, "301-A", "Nomor bed di tile lega"),
    ("Bed/Tile rapat", 17, "Bold", 100, -1, "305-B", "Nomor bed di tile rapat"),
    ("Angka/Metrik", 38, "Semi Bold", 100, -2, "26 dtk", "Alasan utama (tnum)"),
    ("Angka/Jam", 30, "Semi Bold", 100, -2, "10.53", "Jam di bilah atas (tnum)"),
    ("Angka/Hitung mundur", 20, "Extra Bold", 105, 0, "CB 9 dtk", "Hitung mundur Pra-alarm di tile (tnum)"),
    ("Judul/1", 30, "Semi Bold", 120, -2, "Perlu tindakan sekarang", "Judul area"),
    ("Judul/2", 21, "Semi Bold", 120, 0, "Denah Lantai 3", "Judul panel"),
    ("Isi/Besar", 20, "Regular", 140, 0, "Ny. R.W. · 54", "Pasien di item teratas"),
    ("Isi/Normal", 16, "Regular", 135, 0, "Pad terlepas sejak 10.51", "Alasan di baris antrean"),
    ("Isi/Kecil", 14, "Regular", 135, 0, "Periksa konektor di bedhead", "Keterangan"),
    ("Status/Tile", 16, "Bold", 115, 0, "Tidak terpantau", "Kata status di tile lega"),
    ("Status/Rapat", 14, "Bold", 110, 0, "Pra-alarm", "Kata status di tile rapat"),
    ("Label/Level", 14, "Bold", 120, 6, "PRA-ALARM", "Tingkat alarm di antrean, kapital"),
    ("Label/Overline", 13, "Semi Bold", 120, 10, "KAMAR 301", "Label kamar, kapital"),
    ("Tombol/Besar", 21, "Semi Bold", 100, 0, "Panggil Code Blue sekarang", "Aksi utama item teratas"),
    ("Tombol/Normal", 15, "Semi Bold", 100, 0, "Sudah dicek", "Aksi baris"),
]


def css_name(n):
    return "--" + n.replace("/", "-")


def tokens_css():
    def block(mode):
        return "\n".join(f"  {css_name(n)}: {RAW[mode][old].strip()};" for old, n, _, _ in MAP)
    sizes = "\n".join(f"  {css_name(n)}: {v}px;" for n, v in SPACE + RADIUS)
    return f"""/* SiagaBed design system — token (dibuat oleh designs/system/build.py, jangan diedit manual) */
:root {{
{block("light")}
{sizes}
  --font-sans: 'Inter', system-ui, sans-serif;
  --shadow-raised: 0 12px 32px rgba(32,64,112,.10), 0 2px 6px rgba(32,64,112,.05);
  --shadow-alarm: 0 12px 26px rgba(215,38,43,.34);
  --blur-glass: blur(28px) saturate(170%);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
{block("dark")}
  --shadow-raised: 0 16px 40px rgba(0,0,0,.40);
  }}
}}
:root[data-theme="dark"] {{
{block("dark")}
  --shadow-raised: 0 16px 40px rgba(0,0,0,.40);
}}
/* Tampilan ringan untuk PC lambat: tanpa blur, panel solid */
:root[data-render="ringan"] {{ --blur-glass: none; }}
"""


def tokens_json():
    return {
        "color": [{"name": n, "css": css_name(n), "desc": d, "scopes": s.split(","),
                   "light": RAW["light"][old].strip(), "dark": RAW["dark"][old].strip()} for old, n, d, s in MAP],
        "space": [{"name": n, "css": css_name(n), "value": v} for n, v in SPACE],
        "radius": [{"name": n, "css": css_name(n), "value": v} for n, v in RADIUS],
        "type": [{"name": n, "size": s, "style": w, "lh": lh, "ls": ls, "sample": ex, "desc": d} for n, s, w, lh, ls, ex, d in TYPE],
    }


# ------------------------------------------------------------------ lembar fondasi
SHEET_CSS = """
body{width:1920px!important;height:auto!important;overflow:visible!important;padding:64px 80px 80px}
h1{font-size:56px;font-weight:600;letter-spacing:-.03em}
.lead{font-size:20px;color:var(--tx2);margin-top:10px;max-width:1100px;line-height:1.45}
section.s{margin-top:56px}
section.s>h2{font-size:30px;font-weight:600;letter-spacing:-.02em;margin-bottom:6px}
section.s>p{font-size:16px;color:var(--tx2);margin-bottom:20px;max-width:1200px;line-height:1.45}
.swg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.sw{border-radius:16px;overflow:hidden;border:1px solid var(--hair);background:var(--solid)}
.sw .pair{display:grid;grid-template-columns:1fr 1fr;height:70px}
.sw .pair div{display:flex;align-items:flex-end;padding:6px 8px;font-size:11px;font-weight:600}
.sw .meta{padding:10px 12px}
.sw .meta b{display:block;font-size:13px;font-family:ui-monospace,Consolas,monospace}
.sw .meta span{font-size:12px;color:var(--tx3);line-height:1.3;display:block;margin-top:3px}
.ty{display:grid;grid-template-columns:260px 1fr 360px;gap:20px;align-items:center;padding:14px 0;border-bottom:1px solid var(--hair)}
.ty .n{font-size:14px;font-weight:600}.ty .n small{display:block;font-weight:400;color:var(--tx3);font-size:13px;margin-top:2px}
.ty .d{font-size:13px;color:var(--tx3)}
.szr{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}
.szr .it{display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--tx3)}
.szr .it b{color:var(--tx);font-family:ui-monospace,Consolas,monospace;font-weight:600}
.sp-box{background:var(--hi);height:24px}
.rd-box{width:120px;height:80px;background:var(--glass2);border:1px solid var(--hair)}
.rules{width:100%;border-collapse:collapse;font-size:15px}
.rules th{text-align:left;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3);padding:10px 12px;border-bottom:1px solid var(--hair)}
.rules td{padding:12px;border-bottom:1px solid var(--hair);vertical-align:middle;line-height:1.4}
.rules td:first-child{width:220px}
.ic{display:flex;gap:26px;flex-wrap:wrap}
.ic div{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:13px;color:var(--tx2);width:110px;text-align:center}
.ic .g{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--glass2);border:1px solid var(--hair)}
.elv{display:flex;gap:28px}
.elv div{width:260px;height:120px;border-radius:24px;display:flex;align-items:flex-end;padding:16px;font-size:14px;font-weight:600}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.do{border-radius:18px;padding:18px 20px;font-size:15px;line-height:1.5}
.do h3{font-size:15px;margin-bottom:6px}
.do ul{padding-left:18px}
"""


def fondasi():
    sw = []
    for old, n, d, _ in MAP:
        lv, dv = RAW["light"][old].strip(), RAW["dark"][old].strip()
        sw.append(f'<div class="sw"><div class="pair"><div style="background:{lv};color:#0D1626">Terang</div>'
                  f'<div style="background:{dv};color:#EEF2F8">Gelap</div></div>'
                  f'<div class="meta"><b>{n}</b><span>{d}</span></div></div>')
    ty = []
    for n, s, w, lh, ls, ex, d in TYPE:
        weight = {"Regular": 400, "Semi Bold": 600, "Bold": 700, "Extra Bold": 800}[w]
        tt = "text-transform:uppercase;" if n.startswith("Label") else ""
        ty.append(f'<div class="ty"><div class="n">{n}<small>{s}/{lh}% · {w} · {ls:+}%</small></div>'
                  f'<div style="font-size:{min(s, 96)}px;font-weight:{weight};line-height:{lh}%;letter-spacing:{ls / 100}em;{tt}font-feature-settings:\'tnum\' 1">{ex}</div>'
                  f'<div class="d">{d}</div></div>')
    space = "".join(f'<div class="it"><div class="sp-box" style="width:{v}px"></div><b>{n}</b>{v} px</div>' for n, v in SPACE)
    radius = "".join(f'<div class="it"><div class="rd-box" style="border-radius:{min(v, 40)}px"></div><b>{n}</b>{v} px</div>' for n, v in RADIUS)
    g = R3.gly
    icons = "".join(f'<div><span class="g">{g(c, 28) if c not in ("pra", "kr", "cb") else ""}'
                    f'{R3.oct_("var(--hi)", "#fff", 30) if c == "pra" else ""}{R3.tri("var(--hiText)", 28) if c == "kr" else ""}'
                    f'{R3.siren("var(--cbBg)", 30) if c == "cb" else ""}</span>{R3.WORD[c]}</div>'
                    for c in R3.ORDER)
    rules = [
        ("cb", "Merah tua penuh + bingkai putih 3 px, kata <b>CODE BLUE</b> kapital, ikon sirene", "Selalu item #1. Aksi: <b>Tim sudah tiba</b>", "Bunyi berulang; ponsel tim berbunyi"),
        ("pra", "Merah <b>bening</b> + garis merah 4 px yang berdenyut, hitung mundur <b>CB x dtk</b>, ikon oktagon", "Aksi: Panggil Code Blue / Batalkan (tahan 2 dtk)", "Bunyi berulang"),
        ("kr", "Merah <b>penuh</b>, teks putih, ikon segitiga", "Aksi: Sudah dicek / Lihat tren", "Bunyi 1×, tegas"),
        ("ws", "Isi kuning lembut + garis kuning 2 px, ikon lingkaran", "Belum dicek di atas yang sudah dicek", "Bunyi 1×, pelan"),
        ("tk", "Garis biru putus + arsir, ikon kotak tercoret; selalu sebut penyebab", "Masuk antrean di bawah alarm klinis", "Tanpa bunyi klinis"),
        ("ok", "Kaca netral, titik hijau, RR", "Tidak masuk antrean", "Diam"),
        ("away", "Kaca netral, ikon jeda, lama", "Tidak masuk antrean, tetap terlihat", "Diam"),
        ("empty", "Tanpa isi, garis putus tipis", "Tidak masuk antrean", "Diam"),
        ("load", "Abu, garis putus, ikon putar; > 10 dtk berubah jadi Tidak terpantau", "Hanya saat memuat", "Diam"),
    ]
    rows = "".join(f'<tr><td><span class="lgc s-{c}" style="height:34px;font-size:15px">{R3.gly(c, 16)}{R3.WORD[c]}</span></td><td>{a}</td><td>{b}</td><td>{s}</td></tr>' for c, a, b, s in rules)
    body = f"""
<h1>SiagaBed · Design system</h1>
<div class="lead">Dikunci dari layar C″ (Ronde 3). Gaya kaca, Inter, mode terang dan gelap. Diam saat aman, sangat jelas saat ada yang salah. Status tidak pernah dibedakan dengan warna saja: selalu ada kata, ikon, dan bentuk.</div>
<section class="s"><h2>Aturan status</h2><p>Urutan prioritas sama dengan antrean. Kritis merah penuh dan Pra-alarm merah bening adalah keputusan pengguna (Ronde 2); Code Blue dibedakan lewat merah tua, bingkai putih, dan kata kapital.</p>
<table class="rules"><tr><th>Status</th><th>Tampilan</th><th>Antrean</th><th>Bunyi</th></tr>{rows}</table></section>
<section class="s"><h2>Warna</h2><p>Nama semantik, satu nilai per mode. Di kode: <b>designs/system/tokens.css</b> (var(--color-…)). Di Figma: koleksi variabel <b>Warna</b>, mode Terang dan Gelap.</p><div class="swg">{"".join(sw)}</div></section>
<section class="s"><h2>Tipografi</h2><p>Inter (disimpan lokal untuk on-premise). Angka memakai tabular numbers. Bed dan status di antrean terbaca dari 3 m.</p>{"".join(ty)}</section>
<section class="s"><div class="cols2"><div><h2 style="font-size:30px;font-weight:600;margin-bottom:16px">Jarak</h2><div class="szr">{space}</div></div>
<div><h2 style="font-size:30px;font-weight:600;margin-bottom:16px">Radius</h2><div class="szr">{radius}</div></div></div></section>
<section class="s"><h2>Elevasi dan kaca</h2><p>Kaca: blur 28 px + saturasi 170%. Tampilan ringan mematikan blur dan memakai permukaan solid, otomatis di PC lambat.</p>
<div class="elv"><div class="glass">Panel kaca · surface/glass</div><div class="glass2">Kaca tebal · surface/glass-strong</div><div style="background:var(--hi);color:#fff;box-shadow:0 12px 26px rgba(215,38,43,.34)">Alarm · bayangan merah</div><div style="background:var(--solid);border:1px solid var(--hair)">Solid · tampilan ringan</div></div></section>
<section class="s"><h2>Ikon status</h2><p>Garis 2–2,4 px, sudut membulat, 14–22 px. Bentuk berbeda per tingkat supaya tetap terbaca tanpa warna.</p><div class="ic">{icons}</div></section>
<section class="s"><h2>Aturan pakai</h2><div class="cols2">
<div class="do" style="background:var(--okSoft)"><h3>Lakukan</h3><ul><li>Bed dulu, baru pasien: "301-B · Ny. R.W."</li><li>Selalu tulis alasan dalam bahasa perawat, dengan satuan dan jam 24 jam.</li><li>Tunjukkan status kiriman: mengirim → diterima hub → gagal.</li><li>Pakai tile lega untuk ≤ 8 bed, tile rapat untuk 24 bed atau layar 1366.</li></ul></div>
<div class="do" style="background:var(--hiSoft)"><h3>Jangan</h3><ul><li>Membedakan status hanya dengan warna.</li><li>Menaruh gangguan teknis di atas alarm klinis.</li><li>Menggeser item yang sedang disentuh.</li><li>Memakai merah penuh untuk hal selain Kritis, Code Blue, dan tombol Panggil Code Blue.</li><li>Memakai ungu demo di luar mode demo; ungu hanya berarti data fiktif.</li></ul></div></div></section>
"""
    return R3.doc("Design system · Fondasi", R3.css(SHEET_CSS), body, "light")


# ------------------------------------------------------------------ lembar komponen
COMP_CSS = """
body{width:1920px!important;height:auto!important;overflow:visible!important;padding:40px}
.grp{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;margin-bottom:60px}
.c-tile.cb{width:130px}.c-tile.cbd{width:150px}
.c-q{width:1200px}
.c-band{width:560px}
.c-top{position:relative!important;left:0!important;right:auto!important;top:0!important;width:1872px}
.c-calm{width:1200px}
"""

TILE_SAMPLES = [("cb", "305-B", "1", "1 mnt 12 dtk"), ("pra", "301-B", "1", "CB 9 dtk"), ("kr", "302-C", "2", "RR 31 ↑"),
                ("ws", "301-C", "3", "RR 22 · dicek"), ("tk", "302-B", "4", "pad terlepas"), ("ok", "301-A", "", "RR 16"),
                ("away", "302-D", "", "2 mnt"), ("empty", "301-D", "", "siap pakai"), ("load", "302-A", "", "hub 302-A")]

BTN_SAMPLES = [
    ("Panggil Code Blue", f'<span class="btn call c-btn">{R3.PHONE}Panggil Code Blue sekarang</span>'),
    ("Batalkan tahan", '<span class="btn hold c-btn">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></span>'),
    ("Ink", '<span class="btn ink c-btn">Sudah dicek</span>'),
    ("Ghost", '<span class="btn ghost c-btn">Lihat tren</span>'),
    ("Ghost fokus", '<span class="btn ghost focus c-btn">Buka detail bed →</span>'),
    ("Mengirim", f'<span class="btn sending c-btn">{R3.spinner("var(--tx2)")}Mengirim ke hub…</span>'),
]
BTN_ON_RED = [
    ("Di atas merah", '<span class="btn onred c-btn">Sudah dicek</span>'),
    ("Di atas merah garis", '<span class="btn onred2 c-btn">Lihat tren</span>'),
]


def komponen():
    tiles = "".join(R3.tile((i, c, b, s)).replace('class="cb ', 'class="c-tile cb ', 1) for c, i, b, s in TILE_SAMPLES)
    tiles_d = "".join(R3.tile((i, c, b, s), dense=True).replace('class="cbd ', 'class="c-tile cbd ', 1) for c, i, b, s in TILE_SAMPLES)
    chips = R3.tally([("x", c, "", "") for c in R3.ORDER]).replace('class="lgc ', 'class="c-chip lgc ')
    chips = chips.replace('<span class="n">1</span>', "")
    zero = f'<span class="c-chip lgc s-cb zero">{R3.siren("var(--tx3)", 16)}<span class="n">0</span>Code Blue</span>'
    btns = "".join(h for _, h in BTN_SAMPLES)
    onred = '<div style="background:var(--hi);padding:16px;border-radius:16px;display:flex;gap:12px">' + "".join(h for _, h in BTN_ON_RED) + "</div>"
    cbk = R3.bed24("light")
    cbk = cbk[cbk.index('<div class="qi cbk">'):]
    cbk = cbk[:cbk.index('<div class="ri prar">')]
    prar = R3.bed24("light")
    prar = prar[prar.index('<div class="ri prar">'):]
    prar = prar[:prar.index('<div class="ri kr">')]
    q = [cbk, R3.pra_card(), prar, R3.row_kr(), R3.row_kr(sending=True), R3.row_ws("3"), R3.row_tk("4")]
    q = "".join(x.replace('class="qi ', 'class="c-q qi ', 1).replace('class="ri ', 'class="c-q ri ', 1) for x in q)
    band = R3.band(R3.NOTCH_LEGA, focus=False).replace('class="band"', 'class="c-band band"', 1)
    top = R3.topbar().replace('class="top glass"', 'class="c-top top glass"', 1)
    body = f"""
<div class="grp">{tiles}</div>
<div class="grp">{tiles_d}</div>
<div class="grp">{chips}{zero}</div>
<div class="grp">{btns}{onred}</div>
<div class="grp dense" style="flex-direction:column">{q}</div>
<div class="grp">{band}</div>
<div class="grp">{top}</div>
"""
    return R3.doc("Design system · Komponen", R3.css(COMP_CSS), body, "light")


if __name__ == "__main__":
    (HERE / "tokens.css").write_text(tokens_css(), encoding="utf-8")
    # Dasbor (aplikasi) memakai salinan yang sama: css/tokens.css di akar repo.
    (HERE.parent.parent / "css" / "tokens.css").write_text(tokens_css(), encoding="utf-8")
    (HERE / "tokens.json").write_text(json.dumps(tokens_json(), ensure_ascii=False, indent=1), encoding="utf-8")
    (HERE / "fondasi.html").write_text(fondasi(), encoding="utf-8")
    (HERE / "komponen.html").write_text(komponen(), encoding="utf-8")
    print("wrote tokens.css tokens.json fondasi.html komponen.html")
