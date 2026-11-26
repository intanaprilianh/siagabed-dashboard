"""Ronde 1c: arah B dengan gaya kaca (glass) ala Apple, sesuai referensi pengguna.

Tiga tafsiran x dua mode (terang/gelap):
  g1  Literal     : mengikuti susunan referensi (judul besar, nav pil melayang, lembar kaca berisi kartu)
  g2  Denah kaca  : layout B dipertahankan, seluruhnya diberi material kaca
  g3  Terkendali  : kaca hanya untuk bingkai; item alarm solid; antrean atas, denah bawah
Output: g1-light.html, g1-dark.html, ...
"""
import pathlib

HERE = pathlib.Path(__file__).parent
FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">'

TOKENS = {
    "light": """
  --bg:#EEF3F9;--bgTop:#CFE1F6;--glowA:rgba(150,196,245,.75);--glowB:rgba(175,226,228,.6);--glowC:rgba(255,190,180,.45);
  --glass:rgba(255,255,255,.58);--glass2:rgba(255,255,255,.82);--solid:#FFFFFF;--edge:rgba(255,255,255,.95);--hair:rgba(16,32,64,.09);
  --tx:#0D1626;--tx2:#46536A;--tx3:#5F6C80;
  --hi:#D7262B;--hiText:#C01F24;--hiSoft:rgba(215,38,43,.09);--hiEdge:rgba(215,38,43,.35);--onHi:#FFFFFF;
  --md:#9A5B00;--mdDot:#E59A11;--mdSoft:rgba(229,154,17,.13);
  --lo:#1F5E9E;--loSoft:rgba(31,94,158,.10);
  --ok:#1E8048;--okSoft:rgba(30,128,72,.10);
  --shadow:0 12px 32px rgba(32,64,112,.10),0 2px 6px rgba(32,64,112,.05);
  --pillOn:#FFFFFF;--pillOnTx:#0D1626;--ink:#0D1626;--onInk:#FFFFFF;--hatch:rgba(31,94,158,.07);""",
    "dark": """
  --bg:#070B13;--bgTop:#0C1628;--glowA:rgba(54,110,190,.42);--glowB:rgba(28,150,160,.28);--glowC:rgba(255,80,70,.30);
  --glass:rgba(255,255,255,.055);--glass2:rgba(255,255,255,.09);--solid:#121A27;--edge:rgba(255,255,255,.13);--hair:rgba(255,255,255,.08);
  --tx:#EEF2F8;--tx2:#AEB9CB;--tx3:#8795AA;
  --hi:#E0383C;--hiText:#FF7B7E;--hiSoft:rgba(255,90,95,.14);--hiEdge:rgba(255,110,110,.55);--onHi:#FFFFFF;
  --md:#FFC24A;--mdDot:#FFC24A;--mdSoft:rgba(255,194,74,.13);
  --lo:#79B8FF;--loSoft:rgba(121,184,255,.13);
  --ok:#62D49C;--okSoft:rgba(98,212,156,.12);
  --shadow:0 16px 40px rgba(0,0,0,.40);
  --pillOn:rgba(255,255,255,.16);--pillOnTx:#FFFFFF;--ink:#EEF2F8;--onInk:#0A101B;--hatch:rgba(121,184,255,.07);""",
}

BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{position:relative;width:1920px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;color:var(--tx);font-feature-settings:'cv11' 1;
  background:
    radial-gradient(900px 520px at 12% -6%,var(--glowA),transparent 70%),
    radial-gradient(800px 500px at 78% 4%,var(--glowB),transparent 70%),
    radial-gradient(700px 520px at 22% 62%,var(--glowC),transparent 70%),
    linear-gradient(180deg,var(--bgTop) 0%,var(--bg) 46%);}
.glass{background:var(--glass);backdrop-filter:blur(28px) saturate(170%);-webkit-backdrop-filter:blur(28px) saturate(170%);border:1px solid var(--edge);box-shadow:var(--shadow)}
.glass2{background:var(--glass2);backdrop-filter:blur(28px) saturate(170%);-webkit-backdrop-filter:blur(28px) saturate(170%);border:1px solid var(--edge);box-shadow:var(--shadow)}
.sp{flex:1}
.pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;font-size:15px;color:var(--tx2);white-space:nowrap}
.pill b{color:var(--tx);font-weight:600}
.dot{width:8px;height:8px;border-radius:50%;background:var(--ok);display:inline-block}
.logo{display:flex;align-items:center;gap:12px;font-size:21px;font-weight:600;letter-spacing:-.01em}
.logo .mk{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center}
.nav{display:flex;gap:4px;padding:5px;border-radius:999px}
.nav a{height:40px;padding:0 20px;border-radius:999px;display:flex;align-items:center;gap:8px;font-size:15px;font-weight:500;color:var(--tx2)}
.nav a.on{background:var(--pillOn);color:var(--pillOnTx);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.rbtn{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.av{width:30px;height:30px;border-radius:50%;background:var(--ink);color:var(--onInk);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:999px;font-weight:600;white-space:nowrap;font-size:16px;height:48px;padding:0 22px}
.btn.call{background:var(--hi);color:var(--onHi);box-shadow:0 10px 24px rgba(215,38,43,.32)}
.btn.hold{border:1.5px dashed var(--hiEdge);color:var(--tx)}
.btn.hold small{font-size:12px;color:var(--tx3);font-weight:500;padding:3px 8px;border-radius:999px;background:var(--hiSoft)}
.btn.ink{background:var(--ink);color:var(--onInk)}
.btn.ghost{border:1px solid var(--hair);background:var(--glass2);color:var(--tx)}
.lv{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.tag{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap}
.tag.hi{background:var(--hiSoft);color:var(--hiText)}
.tag.md{background:var(--mdSoft);color:var(--md)}
.tag.lo{background:var(--loSoft);color:var(--lo)}
.tag.ok{background:var(--okSoft);color:var(--ok)}
.tag.q{background:var(--hair);color:var(--tx2)}
.ticks{display:flex;gap:4px}
.ticks i{display:block;width:12px;height:30px;border-radius:6px;background:var(--hi)}
.ticks i.off{background:var(--hiSoft);box-shadow:inset 0 0 0 1px var(--hiEdge)}
.ordb{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;background:var(--ink);color:var(--onInk)}
.muted{color:var(--tx3)}

/* tile bed (dipakai bersama) */
.bed{position:relative;border-radius:20px;padding:16px 16px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.bed .bh{display:flex;justify-content:space-between;align-items:center;gap:6px}
.bed .bn{font-size:24px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
.bed .bs{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;line-height:1.2}
.bed .bp{font-size:14px;color:var(--tx2);line-height:1.35}
.bed .bp b{color:var(--tx);font-weight:600}
.bed .bv{margin-top:auto;display:flex;flex-direction:column;align-items:flex-start;gap:4px;white-space:nowrap}
.bed .num{font-feature-settings:'tnum' 1;font-size:38px;font-weight:600;letter-spacing:-.03em;line-height:1}
.bed .num small{font-size:14px;font-weight:500;color:var(--tx3);margin-left:3px;letter-spacing:0}
.bed .bv em{font-style:normal;font-size:12px;color:var(--tx3)}
.bed .ordb{width:26px;height:26px;font-size:13px}
.bed.pra{background:var(--hi);border-color:transparent;color:var(--onHi);box-shadow:0 14px 30px rgba(215,38,43,.35)}
.bed.pra .bp,.bed.pra .bp b,.bed.pra .num small,.bed.pra .bv em,.bed.pra .bs{color:var(--onHi)}
.bed.pra .ordb{background:#fff;color:#C01F24}
.bed.kr{box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}
.bed.kr .bs{color:var(--hiText)} .bed.kr .ordb{background:var(--hi);color:#fff}
.bed.ws{box-shadow:inset 0 0 0 2px var(--mdDot),var(--shadow)}
.bed.ws .bs{color:var(--md)} .bed.ws .ordb{background:var(--mdDot);color:#1B1200}
.bed.tk{border:1.5px dashed var(--lo);background-image:repeating-linear-gradient(135deg,transparent 0 10px,var(--hatch) 10px 20px)}
.bed.tk .bs{color:var(--lo)} .bed.tk .ordb{background:var(--lo);color:#fff}
.bed.ok .bs{color:var(--ok)}
.bed.empty{background:transparent;border:1.5px dashed var(--hair);box-shadow:none}
.bed.empty .bn{color:var(--tx3)}
.bed.away .bs{color:var(--tx2)}
"""

def oct_(c="var(--hi)", inner="#fff", s=22):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 22 22"><path d="M7 1h8l6 6v8l-6 6H7l-6-6V7z" style="fill:{c}"/><rect x="9.7" y="5" width="2.6" height="7.5" style="fill:{inner}"/><rect x="9.7" y="14.5" width="2.6" height="2.6" style="fill:{inner}"/></svg>'

def tri(c="var(--hiText)", s=20):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 22 20"><path d="M11 1.5l10 17H1z" style="fill:none;stroke:{c}" stroke-width="2.4" stroke-linejoin="round"/><rect x="9.8" y="7" width="2.4" height="6" style="fill:{c}"/><rect x="9.8" y="14.6" width="2.4" height="2.4" style="fill:{c}"/></svg>'

def circ(c="var(--md)", s=18):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" style="fill:none;stroke:{c}" stroke-width="2.2"/><rect x="7.9" y="4.5" width="2.2" height="5.5" style="fill:{c}"/><rect x="7.9" y="11.3" width="2.2" height="2.2" style="fill:{c}"/></svg>'

def off(c="var(--lo)", s=18):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="15" height="15" rx="3" style="fill:none;stroke:{c}" stroke-width="2" stroke-dasharray="4 3"/><path d="M4.5 13.5l9-9" style="stroke:{c}" stroke-width="2"/></svg>'

def okdot(c="var(--ok)"):
    return f'<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" style="fill:{c}"/></svg>'

PHONE = '<svg width="20" height="20" viewBox="0 0 22 22"><path d="M4 2h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 4a2 2 0 0 1 2-2z" style="fill:#fff"/></svg>'
SOUND = '<svg width="18" height="18" viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z" style="fill:var(--tx)"/><path d="M11 5.5c1 .8 1 4.2 0 5M13 3.5c2 1.8 2 7.2 0 9" style="fill:none;stroke:var(--tx)" stroke-width="1.4" stroke-linecap="round"/></svg>'
COIL = '<svg width="24" height="24" viewBox="0 0 30 30" fill="none"><rect x="1.5" y="1.5" width="27" height="27" rx="8" style="stroke:var(--tx)" stroke-width="2.2"/><rect x="7.5" y="7.5" width="15" height="15" rx="4.5" style="stroke:var(--tx)" stroke-width="2.2"/><rect x="12" y="12" width="6" height="6" rx="2" style="fill:var(--tx)"/></svg>'

def ticks(on=9, total=15):
    return '<div class="ticks">' + "".join('<i></i>' if i < on else '<i class="off"></i>' for i in range(total)) + '</div>'

BEDS = [
    # (id, cls, badge, glyph, status, patient_html, num_html, age)
    ("301-A", "ok", "", okdot(), "Normal", "<b>Tn. S.H.</b> · 67<br>Pneumonia", '16<small>/mnt</small>', "data 1 dtk"),
    ("301-B", "pra", "1", oct_("#fff", "#C01F24", 16), "Pra-alarm", "<b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1", '26<small>dtk</small>', "data 1 dtk"),
    ("301-C", "ws", "3", circ(s=14), "Waspada · dicek", "<b>Tn. A.M.</b> · 72<br>Gagal jantung", '22<small>/mnt</small>', "data 1 dtk"),
    ("301-D", "empty", "", "", "Bed kosong", "Siap pakai", '<span class="muted">—</span>', "hub siaga"),
    ("302-A", "ok", "", okdot(), "Normal", "<b>Ny. L.K.</b> · 45<br>DM tipe 2, selulitis", '13<small>/mnt</small>', "data 1 dtk"),
    ("302-B", "tk", "4", off(s=14), "Tidak terpantau", "<b>Tn. B.P.</b> · 81<br>Pad terlepas 10.51", '<span class="muted">—</span>', "2 mnt"),
    ("302-C", "kr", "2", tri(s=14), "Kritis", "<b>Ny. D.A.</b> · 60<br>PPOK eksaserbasi", '31<small>/mnt ↑</small>', "data 1 dtk"),
    ("302-D", "away", "", "", "Turun dari bed", "<b>Tn. Y.T.</b> · 38<br>DBD · 2 mnt", '<span class="muted">—</span>', "ditahan"),
]

def bed(b, extra="glass2"):
    bid, cls, badge, glyph, st, pt, num, age = b
    cl = extra if cls not in ("pra", "empty") else ""
    bd = f'<span class="ordb">{badge}</span>' if badge else ""
    return (f'<div class="bed {cls} {cl}"><div class="bh"><span class="bn">{bid}</span>{bd}</div>'
            f'<div class="bs">{glyph}{st}</div><div class="bp">{pt}</div>'
            f'<div class="bv"><span class="num">{num}</span><em>{age}</em></div></div>')

def doc(title, css, body, mode):
    return f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>{title}</title>
{FONT_LINK}
<style>
:root{{{TOKENS[mode]}
}}
{BASE_CSS}
{css}
</style></head>
<body>
{body}
</body></html>"""

# ---------------------------------------------------------------- G1 literal
G1_CSS = """
.top{height:96px;display:flex;align-items:center;padding:0 40px;gap:20px}
.top .nav{position:absolute;left:50%;transform:translateX(-50%);top:24px}
.hero{display:flex;align-items:flex-end;padding:8px 48px 0;height:150px}
.hero .k{font-size:16px;color:var(--tx2);margin-bottom:6px}
.hero h1{font-size:76px;font-weight:300;letter-spacing:-.035em;line-height:1}
.hero h1 b{font-weight:600}
.hero .pills{display:flex;gap:10px;margin-left:auto;padding-bottom:10px}
.sheet{position:absolute;left:24px;right:24px;top:270px;bottom:0;border-radius:40px 40px 0 0;padding:28px;display:grid;grid-template-columns:780px 420px 1fr;gap:20px}
.card{border-radius:28px;padding:24px;display:flex;flex-direction:column}
.ch{display:flex;align-items:center;gap:10px}
.ch .t{font-size:17px;font-weight:600}
.ch .s{font-size:13px;color:var(--tx3)}
.ch .go{margin-left:auto;width:36px;height:36px;border-radius:50%;border:1px solid var(--hair);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--tx2)}
.pra{background:linear-gradient(160deg,var(--hiSoft),transparent 60%),var(--glass2);box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}
.pra .lv{color:var(--hiText)}
.pra .id{display:flex;align-items:flex-end;gap:24px;margin:22px 0 4px}
.pra .bedbig{font-size:132px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.pra .pt{font-size:20px;color:var(--tx2);line-height:1.4;padding-bottom:6px}
.pra .pt b{color:var(--tx);font-weight:600}
.metric{display:flex;align-items:flex-end;gap:36px;margin:26px 0 0;padding:22px 0;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.metric .big{font-size:112px;font-weight:300;letter-spacing:-.04em;line-height:.9}
.metric .big small{font-size:24px;font-weight:500;letter-spacing:0;margin-left:6px}
.metric .cap{font-size:15px;color:var(--tx2);margin-top:8px}
.metric .cd{margin-left:auto;text-align:right}
.metric .cd .ticks{justify-content:flex-end;margin-bottom:10px}
.pra .acts{display:flex;gap:12px;margin-top:auto}
.pra .btn.call{height:76px;font-size:20px;padding:0 28px}
.pra .btn.hold{height:76px;font-size:16px;padding:0 20px}
.mini{border-radius:28px;padding:20px 22px;display:flex;flex-direction:column;gap:10px}
.mini .bid{font-size:44px;font-weight:600;letter-spacing:-.035em;line-height:1}
.mini .pt{font-size:15px;color:var(--tx2)}
.mini .pt b{color:var(--tx);font-weight:600}
.mini .why{font-size:15px;color:var(--tx2);line-height:1.4}
.mini .why b{color:var(--tx)}
.mini .acts{display:flex;gap:8px;margin-top:auto}
.mini .btn{height:42px;font-size:15px;padding:0 18px}
.col{display:flex;flex-direction:column;gap:20px}
.mini.kr{flex:1.25}.mini.kr .lv{color:var(--hiText)}
.mini.ws{flex:1}.mini.ws .lv{color:var(--md)}
.mini.tk{flex:1}.mini.tk .lv{color:var(--lo)}
.plan{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr auto;gap:14px 18px;flex:1;margin-top:16px}
.room{border-radius:22px;padding:12px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:1fr 1fr;gap:10px;border:1px solid var(--hair)}
.rlab{font-size:13px;font-weight:600;color:var(--tx3);letter-spacing:.08em;text-transform:uppercase}
.plan .bed{padding:12px 12px 10px;border-radius:16px}
.plan .bed .bn{font-size:20px}
.plan .bed .num{font-size:30px}
.plan .bed .bp{font-size:13px}
.ns{grid-column:1/3;display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px;color:var(--tx3);padding-top:4px}
"""

def g1(mode):
    beds = [bed(b) for b in BEDS]
    body = f"""
<header class="top">
  <div class="logo"><span class="mk glass2">{COIL}</span>SiagaBed</div>
  <nav class="nav glass"><a class="on">Bangsal</a><a>Log</a><a>Bantuan</a><a>Tim</a></nav>
  <div class="sp"></div>
  <div class="rbtn glass">{SOUND}</div>
  <div class="pill glass2" style="height:48px;padding:0 8px 0 18px"><b>Ns. Rina</b> · jaga pagi <span class="av">R</span></div>
</header>
<section class="hero">
  <div>
    <div class="k">Bangsal Melati · Lantai 3 · Senin, 23 Nov 2026 · 10.53</div>
    <h1><b>4</b> perlu tindakan · <b>7/8</b> terpantau</h1>
  </div>
  <div class="pills">
    <span class="pill glass2"><span class="dot"></span><b>Live</b> · 8 hub</span>
    <span class="pill glass2">Suara <b>aktif</b></span>
    <span class="pill glass2" style="color:var(--lo)">1 bed tidak terpantau</span>
  </div>
</section>
<main class="sheet glass">
  <section class="card pra">
    <div class="ch"><span class="ordb" style="background:var(--hi)">1</span>{oct_()}<span class="lv">Pra-alarm</span><span class="s">mulai 10.53.07 · bunyi berulang</span><span class="go">↗</span></div>
    <div class="id"><span class="bedbig">301-B</span><span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span></div>
    <div class="metric">
      <div><div class="big">26<small>dtk</small></div><div class="cap">tanpa napas efektif</div></div>
      <div class="cd">{ticks()}<div class="cap">Code Blue otomatis dalam <b style="color:var(--tx);font-size:22px">9 dtk</b></div></div>
    </div>
    <div class="acts"><span class="btn call">{PHONE}Panggil Code Blue sekarang</span><span class="btn hold">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></span></div>
  </section>
  <div class="col">
    <section class="mini kr glass2">
      <div class="ch"><span class="ordb" style="background:var(--hi);color:#fff">2</span>{tri()}<span class="lv">Kritis</span><span class="go">↗</span></div>
      <div class="bid">302-C</div><div class="pt"><b>Ny. D.A.</b> · 60 · PPOK eksaserbasi</div>
      <div class="why"><b>RR 31 /mnt ↑</b> · ≥ 30 selama 1 mnt 20 dtk</div>
      <div class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span></div>
    </section>
    <section class="mini ws glass2">
      <div class="ch"><span class="ordb" style="background:var(--mdDot);color:#1B1200">3</span>{circ()}<span class="lv">Waspada</span><span class="tag ok" style="margin-left:auto">✓ dicek 10.42</span></div>
      <div style="display:flex;align-items:baseline;gap:14px"><span class="bid" style="font-size:34px">301-C</span><span class="pt"><b>Tn. A.M.</b> · 72 · Gagal jantung</span></div>
      <div class="why">RR 22 /mnt · Ns. Rina · diterima hub</div>
    </section>
    <section class="mini tk glass2">
      <div class="ch"><span class="ordb" style="background:var(--lo);color:#fff">4</span>{off()}<span class="lv">Tidak terpantau</span><span class="go">↗</span></div>
      <div style="display:flex;align-items:baseline;gap:14px"><span class="bid" style="font-size:34px">302-B</span><span class="pt"><b>Tn. B.P.</b> · 81 · Stroke iskemik</span></div>
      <div class="why"><b>Pad terlepas sejak 10.51</b> · periksa konektor di bedhead</div>
    </section>
  </div>
  <section class="card glass2">
    <div class="ch"><span class="t">Denah Lantai 3</span><span class="s">angka = urutan antrean</span><span class="go">↗</span></div>
    <div class="plan">
      <span class="rlab">Kamar 301</span><span class="rlab">Kamar 302</span>
      <div class="room">{beds[0]}{beds[1]}{beds[2]}{beds[3]}</div>
      <div class="room">{beds[4]}{beds[5]}{beds[6]}{beds[7]}</div>
      <div class="ns"><span>Koridor</span><span class="pill glass2" style="height:32px"><b>Nurse station</b></span></div>
    </div>
  </section>
</main>"""
    return doc(f"G1 · Literal · {mode}", G1_CSS, body, mode)

# ---------------------------------------------------------------- G2 denah kaca
G2_CSS = """
.top{position:absolute;left:24px;right:24px;top:20px;height:72px;border-radius:24px;display:flex;align-items:center;gap:24px;padding:0 14px 0 18px}
.ward{font-size:16px;color:var(--tx2)}.ward b{color:var(--tx);font-weight:600}
.clock{font-feature-settings:'tnum' 1;font-size:30px;font-weight:600;letter-spacing:-.02em;padding:0 10px}
.wrap{position:absolute;left:24px;right:24px;top:112px;bottom:24px;display:grid;grid-template-columns:1080px 1fr;gap:20px}
.left{display:flex;flex-direction:column;gap:14px}
.hd{display:flex;align-items:baseline;gap:14px;padding:6px 8px 2px}
.hd h1{font-size:30px;font-weight:600;letter-spacing:-.02em}
.hd span{font-size:15px;color:var(--tx3)}
.qi{border-radius:28px;padding:22px 26px}
.pra{background:linear-gradient(150deg,var(--hiSoft),transparent 55%),var(--glass2);box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}
.qh{display:flex;align-items:center;gap:10px}
.qh .s{font-size:14px;color:var(--tx3);margin-left:6px}
.pra .lv{color:var(--hiText)}
.pra .id{display:flex;align-items:flex-end;gap:26px;margin:16px 0 0}
.pra .bedbig{font-size:120px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.pra .pt{font-size:20px;color:var(--tx2);line-height:1.4;padding-bottom:4px}
.pra .pt b{color:var(--tx);font-weight:600}
.pra .why{display:flex;align-items:center;gap:28px;margin:20px 0;padding:16px 20px;border-radius:20px;background:var(--hiSoft)}
.pra .why .r{font-size:38px;font-weight:600;letter-spacing:-.02em}
.pra .why .r small{font-size:18px;color:var(--tx2);font-weight:500;letter-spacing:0;margin-left:4px}
.pra .why .cdt{font-size:15px;color:var(--tx2);line-height:1.3}
.pra .why .cdt b{display:block;font-size:28px;color:var(--tx);font-weight:600}
.pra .acts{display:flex;gap:12px}
.pra .btn.call{height:72px;font-size:21px;padding:0 34px}
.pra .btn.hold{height:72px;font-size:17px;padding:0 26px}
.ri{border-radius:24px;padding:16px 22px;display:grid;grid-template-columns:170px 140px 250px 1fr auto;align-items:center;gap:16px}
.ri .lv{display:flex;align-items:center;gap:8px}
.ri .bid{font-size:40px;font-weight:600;letter-spacing:-.035em;line-height:1}
.ri .pt{font-size:15px;color:var(--tx2);line-height:1.35}.ri .pt b{color:var(--tx);font-weight:600}
.ri .why{font-size:16px;line-height:1.35}.ri .why small{display:block;font-size:14px;color:var(--tx3)}
.ri .acts{display:flex;gap:8px}
.ri .btn{height:44px;font-size:15px;padding:0 18px}
.ri.kr{box-shadow:inset 0 0 0 1.5px var(--hiEdge),var(--shadow)}.ri.kr .lv{color:var(--hiText)}
.ri.ws .lv{color:var(--md)}.ri.tk .lv{color:var(--lo)}
.ri.ws .bid,.ri.tk .bid{font-size:32px}
.foot{margin-top:auto;padding:12px 18px;border-radius:20px;font-size:14px;color:var(--tx3);display:flex;gap:24px}
.foot b{color:var(--tx2);font-weight:600}
.right{border-radius:32px;padding:22px 22px 18px;display:flex;flex-direction:column}
.rhd{display:flex;justify-content:space-between;align-items:baseline;padding:0 4px 14px}
.rhd h2{font-size:21px;font-weight:600}
.rhd .cnt{font-size:15px;color:var(--tx2)}.rhd .cnt b{font-size:26px;color:var(--tx);font-weight:600;margin-right:6px}
.plan{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:1fr 76px;gap:14px}
.room{position:relative;border-radius:24px;border:1px solid var(--hair);padding:40px 14px 14px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:1fr 1fr;gap:14px}
.room .rlab{position:absolute;top:13px;left:18px;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.corr{grid-column:1/3;border-radius:20px;border:1px dashed var(--hair);display:flex;align-items:center;justify-content:center;gap:14px;font-size:13px;color:var(--tx3);letter-spacing:.06em;text-transform:uppercase}
.legend{display:flex;gap:20px;padding:12px 6px 0;font-size:13px;color:var(--tx3)}
"""

def g2(mode):
    beds = [bed(b) for b in BEDS]
    body = f"""
<header class="top glass">
  <div class="logo"><span class="mk glass2" style="width:40px;height:40px;border-radius:12px">{COIL}</span>SiagaBed</div>
  <div class="ward"><b>Bangsal Melati</b> · Lantai 3</div>
  <nav class="nav glass2"><a class="on">Bangsal</a><a>Log</a><a>Bantuan</a><a>Tim</a></nav>
  <div class="sp"></div>
  <span class="pill glass2"><b>Ns. Rina</b> · jaga</span>
  <span class="pill glass2">{SOUND}<b>Suara aktif</b></span>
  <span class="pill glass2"><span class="dot"></span><b>Live</b> · 8 hub</span>
  <span class="pill glass2"><b>7/8</b> terpantau</span>
  <span class="clock">10.53</span>
</header>
<div class="wrap">
  <section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>4 item · urut paling genting</span></div>
    <div class="qi pra">
      <div class="qh"><span class="ordb" style="background:var(--hi);color:#fff">1</span>{oct_()}<span class="lv">Pra-alarm</span><span class="s">mulai 10.53.07 · bunyi berulang</span></div>
      <div class="id"><span class="bedbig">301-B</span><span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span></div>
      <div class="why"><span class="r">26 dtk<small>tanpa napas efektif</small></span><span class="sp"></span>{ticks()}<span class="cdt">Code Blue otomatis<b>9 dtk</b></span></div>
      <div class="acts"><span class="btn call">{PHONE}Panggil Code Blue sekarang</span><span class="btn hold">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></span></div>
    </div>
    <div class="ri kr glass2">
      <span class="lv"><span class="ordb" style="background:var(--hi);color:#fff">2</span>{tri()}Kritis</span>
      <span class="bid">302-C</span>
      <span class="pt"><b>Ny. D.A.</b> · 60<br>PPOK eksaserbasi</span>
      <span class="why"><b>RR 31 /mnt ↑</b><small>≥ 30 selama 1 mnt 20 dtk</small></span>
      <span class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span></span>
    </div>
    <div class="ri ws glass2">
      <span class="lv"><span class="ordb" style="background:var(--mdDot);color:#1B1200">3</span>{circ()}Waspada</span>
      <span class="bid">301-C</span>
      <span class="pt"><b>Tn. A.M.</b> · 72 · Gagal jantung</span>
      <span class="why">RR 22 /mnt<small>✓ Dicek Ns. Rina 10.42 · diterima hub</small></span>
      <span class="acts"><span class="btn ghost">Lihat tren</span></span>
    </div>
    <div class="ri tk glass2">
      <span class="lv"><span class="ordb" style="background:var(--lo);color:#fff">4</span>{off()}Tidak terpantau</span>
      <span class="bid">302-B</span>
      <span class="pt"><b>Tn. B.P.</b> · 81 · Stroke iskemik</span>
      <span class="why">Pad terlepas sejak 10.51<small>Periksa konektor di bedhead</small></span>
      <span class="acts"><span class="btn ghost">Buka detail</span></span>
    </div>
    <div class="foot glass"><span>Tidak dibunyikan, tetap terlihat di denah:</span><span><b>302-D</b> turun dari bed · 2 mnt</span><span><b>301-D</b> bed kosong</span></div>
  </section>
  <section class="right glass">
    <div class="rhd"><h2>Denah Lantai 3</h2><div class="cnt"><b>7/8</b>bed terpantau</div></div>
    <div class="plan">
      <div class="room"><span class="rlab">Kamar 301</span>{beds[0]}{beds[1]}{beds[2]}{beds[3]}</div>
      <div class="room"><span class="rlab">Kamar 302</span>{beds[4]}{beds[5]}{beds[6]}{beds[7]}</div>
      <div class="corr"><span>Koridor</span><span class="pill glass2" style="height:34px;text-transform:none;letter-spacing:0"><b>Nurse station</b></span></div>
    </div>
    <div class="legend"><span>Angka bulat = urutan di antrean</span><span>Arsir = tidak ada data</span></div>
  </section>
</div>"""
    return doc(f"G2 · Denah kaca · {mode}", G2_CSS, body, mode)

# ---------------------------------------------------------------- G3 terkendali
G3_CSS = """
body{background:linear-gradient(180deg,var(--bgTop) 0%,var(--bg) 40%)}
.top{position:absolute;left:24px;right:24px;top:18px;height:64px;border-radius:999px;display:flex;align-items:center;gap:20px;padding:0 10px 0 14px}
.ward{font-size:16px;color:var(--tx2)}.ward b{color:var(--tx);font-weight:600}
.clock{font-feature-settings:'tnum' 1;font-size:28px;font-weight:600;letter-spacing:-.02em;padding:0 14px 0 6px}
.q{position:absolute;left:24px;right:24px;top:100px;height:470px;display:grid;grid-template-columns:900px repeat(3,minmax(0,1fr));gap:16px}
.solid{background:var(--solid);border:1px solid var(--hair);box-shadow:var(--shadow)}
.pra{border-radius:28px;background:var(--hi);color:#fff;padding:26px 30px;display:flex;flex-direction:column;box-shadow:0 20px 44px rgba(215,38,43,.32)}
.pra .qh{display:flex;align-items:center;gap:10px}
.pra .lv{color:#fff}
.pra .qh .s{font-size:14px;opacity:.9;margin-left:6px}
.pra .id{display:flex;align-items:flex-end;gap:26px;margin:18px 0 0}
.pra .bedbig{font-size:128px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.pra .pt{font-size:20px;line-height:1.4;padding-bottom:4px;opacity:.95}
.pra .why{display:flex;align-items:center;gap:26px;margin:22px 0;padding:16px 0;border-top:1px solid rgba(255,255,255,.35);border-bottom:1px solid rgba(255,255,255,.35)}
.pra .why .r{font-size:40px;font-weight:600;letter-spacing:-.02em}
.pra .why .r small{font-size:18px;font-weight:500;letter-spacing:0;margin-left:4px;opacity:.9}
.pra .ticks i{background:#fff}.pra .ticks i.off{background:rgba(255,255,255,.18);box-shadow:none}
.pra .cdt{font-size:15px;line-height:1.3}.pra .cdt b{display:block;font-size:28px;font-weight:600}
.pra .acts{display:flex;gap:12px;margin-top:auto}
.pra .btn.call{background:#fff;color:#B81D22;height:72px;font-size:21px;padding:0 32px;box-shadow:none}
.pra .btn.hold{height:72px;border-color:rgba(255,255,255,.7);color:#fff;font-size:17px}
.pra .btn.hold small{background:rgba(255,255,255,.18);color:#fff}
.ci{border-radius:28px;padding:22px;display:flex;flex-direction:column;gap:10px}
.ci .qh{display:flex;align-items:center;gap:8px}
.ci .bid{font-size:52px;font-weight:600;letter-spacing:-.04em;line-height:1;margin-top:10px}
.ci .pt{font-size:15px;color:var(--tx2);line-height:1.4}.ci .pt b{color:var(--tx);font-weight:600}
.ci .why{font-size:16px;line-height:1.4;padding-top:12px;border-top:1px solid var(--hair)}
.ci .why small{display:block;font-size:14px;color:var(--tx3)}
.ci .acts{display:flex;flex-direction:column;gap:8px;margin-top:auto}
.ci .btn{height:46px;font-size:15px;width:100%}
.ci.kr{box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}.ci.kr .lv{color:var(--hiText)}
.ci.ws .lv{color:var(--md)}.ci.tk .lv{color:var(--lo)}
.beds{position:absolute;left:24px;right:24px;top:590px;bottom:24px;border-radius:32px;padding:18px 20px 20px;display:flex;flex-direction:column}
.bhd{display:flex;align-items:baseline;gap:14px;padding:0 6px 12px}
.bhd h2{font-size:20px;font-weight:600}
.bhd span{font-size:14px;color:var(--tx3)}
.rooms{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.room{border-radius:24px;border:1px solid var(--hair);padding:36px 12px 12px;position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.room .rlab{position:absolute;top:11px;left:16px;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.room .rlab em{font-style:normal;text-transform:none;letter-spacing:0;font-weight:500;margin-left:8px}
"""

def g3(mode):
    beds = [bed(b, "solid") for b in BEDS]
    body = f"""
<header class="top glass">
  <div class="logo"><span class="mk glass2" style="width:40px;height:40px;border-radius:50%">{COIL}</span>SiagaBed</div>
  <div class="ward"><b>Bangsal Melati</b> · Lantai 3</div>
  <nav class="nav glass2" style="padding:4px"><a class="on" style="height:38px">Bangsal</a><a style="height:38px">Log</a><a style="height:38px">Bantuan</a><a style="height:38px">Tim</a></nav>
  <div class="sp"></div>
  <span class="pill glass2"><b>Ns. Rina</b> · jaga pagi</span>
  <span class="pill glass2">{SOUND}<b>Suara aktif</b></span>
  <span class="pill glass2"><span class="dot"></span><b>Live</b> · 8 hub</span>
  <span class="pill glass2"><b>7/8</b> terpantau</span>
  <span class="clock">10.53</span>
</header>
<section class="q">
  <div class="pra">
    <div class="qh"><span class="ordb" style="background:#fff;color:#B81D22">1</span>{oct_("#fff", "#B81D22")}<span class="lv">Pra-alarm</span><span class="s">mulai 10.53.07 · bunyi berulang</span></div>
    <div class="id"><span class="bedbig">301-B</span><span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span></div>
    <div class="why"><span class="r">26 dtk<small>tanpa napas efektif</small></span><span class="sp"></span>{ticks()}<span class="cdt">Code Blue otomatis<b>9 dtk</b></span></div>
    <div class="acts"><span class="btn call">Panggil Code Blue sekarang</span><span class="btn hold">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></span></div>
  </div>
  <div class="ci kr solid">
    <div class="qh"><span class="ordb" style="background:var(--hi);color:#fff">2</span>{tri()}<span class="lv">Kritis</span></div>
    <div class="bid">302-C</div><div class="pt"><b>Ny. D.A.</b> · 60<br>PPOK eksaserbasi</div>
    <div class="why"><b>RR 31 /mnt ↑</b><small>≥ 30 selama 1 mnt 20 dtk</small></div>
    <div class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span></div>
  </div>
  <div class="ci ws solid">
    <div class="qh"><span class="ordb" style="background:var(--mdDot);color:#1B1200">3</span>{circ()}<span class="lv">Waspada</span></div>
    <div class="bid">301-C</div><div class="pt"><b>Tn. A.M.</b> · 72<br>Gagal jantung</div>
    <div class="why">RR 22 /mnt<small>✓ Dicek Ns. Rina 10.42 · diterima hub</small></div>
    <div class="acts"><span class="btn ghost">Lihat tren</span></div>
  </div>
  <div class="ci tk solid">
    <div class="qh"><span class="ordb" style="background:var(--lo);color:#fff">4</span>{off()}<span class="lv">Tidak terpantau</span></div>
    <div class="bid">302-B</div><div class="pt"><b>Tn. B.P.</b> · 81<br>Stroke iskemik</div>
    <div class="why">Pad terlepas sejak 10.51<small>Periksa konektor di bedhead</small></div>
    <div class="acts"><span class="btn ghost">Buka detail</span></div>
  </div>
</section>
<section class="beds glass">
  <div class="bhd"><h2>Semua bed</h2><span>urut posisi di kamar · angka = urutan antrean · 302-D turun dari bed dan 301-D bed kosong tidak dibunyikan</span></div>
  <div class="rooms">
    <div class="room"><span class="rlab">Kamar 301<em>3 terisi</em></span>{beds[0]}{beds[1]}{beds[2]}{beds[3]}</div>
    <div class="room"><span class="rlab">Kamar 302<em>4 terisi</em></span>{beds[4]}{beds[5]}{beds[6]}{beds[7]}</div>
  </div>
</section>"""
    return doc(f"G3 · Terkendali · {mode}", G3_CSS, body, mode)

for name, fn in (("g1", g1), ("g2", g2), ("g3", g3)):
    for mode in ("light", "dark"):
        p = HERE / f"{name}-{mode}.html"
        p.write_text(fn(mode), encoding="utf-8")
        print("wrote", p.name)
