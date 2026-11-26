"""Ronde 2 · Variasi dari G2 (Denah kaca), dengan denah lantai yang dibuat ringkas.

Permintaan pengguna: denah cukup menunjukkan status tiap bed (Code Blue, Pra-alarm, Kritis,
Waspada, Tidak terpantau, Normal, dll.) supaya terbaca sekilas; nama dan detail lain muncul
saat bed diklik. Tiap variasi memperlihatkan keadaan "302-C sedang diklik".

  a  Sekilas        (hierarki) : denah paling sederhana, antrean dapat ruang lebih; detail = popover
  b  Denah + panel  (signature): bed digambar sebagai "lampu" di denah; detail = panel bed tetap di bawah denah
  c  Pita kamar     (craft)    : tiap kamar satu pita 4 bed + hitungan status; detail = pita terbuka di bawah kamar

Token, CSS dasar, dan ikon diambil dari designs/round-1c/build.py.
Output: a-light.html, a-dark.html, b-..., c-...
"""
import pathlib

HERE = pathlib.Path(__file__).parent
_src = (HERE.parent / "round-1c" / "build.py").read_text(encoding="utf-8")
_ns = {"__file__": str(HERE.parent / "round-1c" / "build.py")}
exec(_src.split("# ---------------------------------------------------------------- G1 literal")[0], _ns)
globals().update({k: v for k, v in _ns.items() if not k.startswith("__") and k != "HERE"})

TOKENS["light"] += "--cbBg:#7A0E13;--sel:#0D1626;"
TOKENS["dark"] += "--cbBg:#B3161D;--sel:#EEF2F8;"


def siren(c="#fff", s=18):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 20 20"><path d="M5 15V10a5 5 0 0 1 10 0v5z" style="fill:{c}"/>'
            f'<rect x="3" y="15.5" width="14" height="2.6" rx="1" style="fill:{c}"/>'
            f'<path d="M10 1v2.6M2.6 4.2l1.8 1.8M17.4 4.2l-1.8 1.8" style="stroke:{c}" stroke-width="1.8" stroke-linecap="round"/></svg>')


def pause(c="var(--tx2)", s=16):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 16 16"><rect x="3" y="2.5" width="3.4" height="11" rx="1.2" style="fill:{c}"/>'
            f'<rect x="9.6" y="2.5" width="3.4" height="11" rx="1.2" style="fill:{c}"/></svg>')


def dash(c="var(--tx3)", s=16):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" style="fill:none;stroke:{c}" stroke-width="1.6" stroke-dasharray="3 2.4"/></svg>'


# status -> (glyph untuk tile, kata status)
def glyph(cls, s=16, alt=False):
    if alt and cls == "kr":
        return tri("#fff", s + 1)
    if alt and cls == "pra":
        return oct_("var(--hi)", "#fff", s + 2)
    return {
        "cb": siren("#fff", s + 2),
        "pra": oct_("#fff", "#C01F24", s + 2),
        "kr": tri(s=s + 1),
        "ws": circ(s=s),
        "tk": off(s=s),
        "ok": okdot(),
        "away": pause(s=s - 2),
        "empty": dash(s=s - 2),
    }[cls]


WORD = {"cb": "Code Blue", "pra": "Pra-alarm", "kr": "Kritis", "ws": "Waspada", "tk": "Tidak terpantau",
        "ok": "Normal", "away": "Turun dari bed", "empty": "Bed kosong"}

# (id, status, urutan antrean, keterangan singkat)
BEDS2 = [
    ("301-A", "ok", "", "RR 16"),
    ("301-B", "pra", "1", "26 dtk · CB 9 dtk"),
    ("301-C", "ws", "3", "RR 22 · dicek"),
    ("301-D", "empty", "", "siap pakai"),
    ("302-A", "ok", "", "RR 13"),
    ("302-B", "tk", "4", "pad terlepas"),
    ("302-C", "kr", "2", "RR 31 ↑"),
    ("302-D", "away", "", "2 mnt · ditahan"),
]
SELECTED = "302-C"

STATUS_CSS = """
.s-ok{}
.s-pra{background:var(--hi)!important;color:var(--onHi);border-color:transparent!important;box-shadow:0 12px 26px rgba(215,38,43,.34)}
.s-cb{background:var(--cbBg)!important;color:#fff;border-color:transparent!important;box-shadow:0 12px 26px rgba(122,14,19,.34)}
.s-kr{background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}
.s-ws{background:linear-gradient(var(--mdSoft),var(--mdSoft)),var(--glass2);box-shadow:inset 0 0 0 2px var(--mdDot),var(--shadow)}
.s-tk{border:1.5px dashed var(--lo)!important;background-image:repeating-linear-gradient(135deg,transparent 0 10px,var(--hatch) 10px 20px)}
.s-away{}
.s-empty{background:transparent!important;border:1.5px dashed var(--hair)!important;box-shadow:none!important;backdrop-filter:none!important}
.s-ok .st{color:var(--ok)} .s-kr .st{color:var(--hiText)} .s-ws .st{color:var(--md)} .s-tk .st{color:var(--lo)}
.s-away .st{color:var(--tx2)} .s-empty .st,.s-empty .id{color:var(--tx3)}
.s-pra .st,.s-cb .st,.s-pra .sub,.s-cb .sub{color:#fff}
.ob{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex:none}
.s-pra .ob{background:#fff;color:#C01F24} .s-kr .ob{background:var(--hi);color:#fff}
.s-ws .ob{background:var(--mdDot);color:#1B1200} .s-tk .ob{background:var(--lo);color:#fff}
.sel{box-shadow:inset 0 0 0 2px var(--hiEdge),0 0 0 4px var(--bg),0 0 0 7px var(--sel)!important}

/* legenda status */
.lgd{display:flex;flex-wrap:wrap;gap:8px}
.lgc{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;border:1px solid transparent}
.lgc.s-ok{background:var(--glass2);color:var(--ok);border-color:var(--hair)}
.lgc.s-kr{color:var(--hiText);box-shadow:inset 0 0 0 1.5px var(--hiEdge)}
.lgc.s-ws{color:var(--md);box-shadow:inset 0 0 0 1.5px var(--mdDot)}
.lgc.s-tk{color:var(--lo)}
.lgc.s-away{background:var(--hair);color:var(--tx2)}
.lgc.s-empty{color:var(--tx3)}
.lgc.s-pra,.lgc.s-cb{box-shadow:none}
.lgc.zero{background:transparent!important;color:var(--tx3)!important;border:1px solid var(--hair)!important;box-shadow:none!important}
.lgc.zero svg{opacity:.55}
.lgc .n{font-feature-settings:'tnum' 1;font-weight:700}
"""


def legend(counts=None, alt=False):
    order = ["cb", "pra", "kr", "ws", "tk", "ok", "away", "empty"]
    out = []
    for c in order:
        n = None if counts is None else counts.get(c, 0)
        zero = " zero" if n == 0 else ""
        g = glyph(c, 14, alt)
        if n == 0 and c in ("cb", "pra"):
            g = siren("var(--tx3)", 16) if c == "cb" else oct_("var(--tx3)", "var(--bg)", 16)
        num = f'<span class="n">{n}</span>' if n is not None else ""
        out.append(f'<span class="lgc s-{c}{zero}">{g}{num}{WORD[c]}</span>')
    return '<div class="lgd">' + "".join(out) + "</div>"


def rr_points(w, h, lo=10, hi=36):
    vals = [19, 19, 20, 20, 21, 21, 22, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 27, 28, 28, 29, 29, 30, 30, 31, 31, 31, 31]
    n = len(vals) - 1
    y = lambda v: h - (v - lo) / (hi - lo) * h
    pts = " ".join(f"{i / n * w:.1f},{y(v):.1f}" for i, v in enumerate(vals))
    return pts, y


def spark(w=300, h=86):
    pts, y = rr_points(w, h)
    return f"""<svg width="{w}" height="{h + 18}" viewBox="0 0 {w} {h + 18}" style="overflow:visible">
  <line x1="0" x2="{w}" y1="{y(30):.1f}" y2="{y(30):.1f}" style="stroke:var(--hiEdge)" stroke-width="1.2" stroke-dasharray="4 4"/>
  <line x1="0" x2="{w}" y1="{y(20):.1f}" y2="{y(20):.1f}" style="stroke:var(--mdDot)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".8"/>
  <text x="{w}" y="{y(30) - 5:.1f}" text-anchor="end" style="fill:var(--hiText);font-size:11px;font-weight:600">30 Kritis</text>
  <text x="{w}" y="{y(20) - 5:.1f}" text-anchor="end" style="fill:var(--md);font-size:11px;font-weight:600">20 Waspada</text>
  <polyline points="{pts}" style="fill:none;stroke:var(--tx)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="{w}" cy="{y(31):.1f}" r="4.5" style="fill:var(--hi)"/>
  <text x="0" y="{h + 16}" style="fill:var(--tx3);font-size:11px">10.23</text>
  <text x="{w}" y="{h + 16}" text-anchor="end" style="fill:var(--tx3);font-size:11px">10.53</text>
</svg>"""


# ------------------------------------------------------------------ bagian bersama (bilah atas + antrean)
COMMON_CSS = """
.top{position:absolute;left:24px;right:24px;top:20px;height:72px;border-radius:24px;display:flex;align-items:center;gap:24px;padding:0 14px 0 18px}
.ward{font-size:16px;color:var(--tx2)}.ward b{color:var(--tx);font-weight:600}
.clock{font-feature-settings:'tnum' 1;font-size:30px;font-weight:600;letter-spacing:-.02em;padding:0 10px}
.wrap{position:absolute;left:24px;right:24px;top:112px;bottom:24px;display:grid;gap:20px}
.left{display:flex;flex-direction:column;gap:14px;min-width:0}
.hd{display:flex;align-items:baseline;gap:14px;padding:6px 8px 2px}
.hd h1{font-size:30px;font-weight:600;letter-spacing:-.02em}
.hd span{font-size:15px;color:var(--tx3)}
.qi{border-radius:28px;padding:22px 26px}
.qi.pra{background:linear-gradient(150deg,var(--hiSoft),transparent 55%),var(--glass2);box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)}
.qh{display:flex;align-items:center;gap:10px}
.qh .s{font-size:14px;color:var(--tx3);margin-left:6px}
.qi.pra .lv{color:var(--hiText)}
.qi.pra .id{display:flex;align-items:flex-end;gap:26px;margin:16px 0 0}
.qi.pra .bedbig{font-size:120px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.qi.pra .pt{font-size:20px;color:var(--tx2);line-height:1.4;padding-bottom:4px}
.qi.pra .pt b{color:var(--tx);font-weight:600}
.qi.pra .why{display:flex;align-items:center;gap:28px;margin:20px 0;padding:16px 20px;border-radius:20px;background:var(--hiSoft)}
.qi.pra .why .r{font-size:38px;font-weight:600;letter-spacing:-.02em}
.qi.pra .why .r small{font-size:18px;color:var(--tx2);font-weight:500;letter-spacing:0;margin-left:4px}
.qi.pra .why .cdt{font-size:15px;color:var(--tx2);line-height:1.3}
.qi.pra .why .cdt b{display:block;font-size:28px;color:var(--tx);font-weight:600}
.qi.pra .acts{display:flex;gap:12px}
.qi.pra .btn.call{height:72px;font-size:21px;padding:0 34px}
.qi.pra .btn.hold{height:72px;font-size:17px;padding:0 26px}
.ri{border-radius:24px;padding:16px 22px;display:grid;grid-template-columns:190px 150px 290px 1fr auto;align-items:center;gap:16px}
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
.panel{border-radius:32px;padding:22px;display:flex;flex-direction:column;min-width:0}
.rhd{display:flex;justify-content:space-between;align-items:baseline;padding:0 4px 14px}
.rhd h2{font-size:21px;font-weight:600}
.rhd .cnt{font-size:15px;color:var(--tx2)}.rhd .cnt b{font-size:26px;color:var(--tx);font-weight:600;margin-right:6px}
.corr{border-radius:18px;border:1px dashed var(--hair);height:52px;display:flex;align-items:center;justify-content:center;gap:14px;font-size:13px;color:var(--tx3);letter-spacing:.06em;text-transform:uppercase}
.hint{font-size:13px;color:var(--tx3)}
.x{width:36px;height:36px;border-radius:50%;border:1px solid var(--hair);display:inline-flex;align-items:center;justify-content:center;font-size:18px;color:var(--tx2);flex:none}
"""


def topbar():
    return f"""
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
</header>"""


def queue():
    return f"""
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
  </section>"""


def ob(badge):
    return f'<span class="ob">{badge}</span>' if badge else ""


# ------------------------------------------------------------------ A · Sekilas (hierarki)
A_CSS = """
.wrap{grid-template-columns:1fr 600px}
.rooms{display:flex;flex-direction:column;gap:14px}
.room{position:relative;border-radius:24px;border:1px solid var(--hair);padding:42px 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.room .rlab{position:absolute;top:14px;left:18px;font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.cb{position:relative;height:104px;border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between}
.cb .h{display:flex;align-items:center;justify-content:space-between}
.cb .id{font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1}
.cb .st{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:600;white-space:nowrap}
.panel .corr{margin-top:14px}
.panel .lgwrap{margin-top:auto;padding:14px 4px 0;border-top:1px solid var(--hair)}
.panel .lgwrap .hint{display:block;margin-bottom:10px}
.pop{position:absolute;z-index:5;top:750px;left:1330px;width:452px;border-radius:24px;padding:20px 22px 22px;display:flex;flex-direction:column;gap:14px;
  background:var(--solid);border:1px solid var(--hair);
  box-shadow:0 28px 70px rgba(10,20,40,.30),0 4px 12px rgba(10,20,40,.10);color:var(--tx)}
.pop:before{content:"";position:absolute;top:-9px;left:52px;width:18px;height:18px;transform:rotate(45deg);background:var(--solid);border-left:1px solid var(--hair);border-top:1px solid var(--hair);border-radius:4px 0 0 0}
.pop .ph{display:flex;align-items:center;gap:12px}
.pop .ph .big{font-size:34px;font-weight:700;letter-spacing:-.03em}
.pop .who{font-size:19px;font-weight:600}
.pop .who small{display:block;font-size:15px;font-weight:400;color:var(--tx2);margin-top:3px}
.pop .why{padding:12px 14px;border-radius:14px;background:var(--hiSoft);font-size:16px;line-height:1.4}
.pop .why b{color:var(--hiText)}
.pop .meta{font-size:13px;color:var(--tx3);display:flex;gap:16px}
.pop .acts{display:flex;gap:10px}
.pop .btn{height:46px;font-size:15px}
"""


A_POP = f"""<div class="pop">
  <div class="ph"><span class="big">302-C</span><span class="tag hi">{tri(s=14)}Kritis</span><span class="sp"></span><span class="x">×</span></div>
  <div class="who">Ny. D.A. · 60<small>PPOK eksaserbasi · No. RM 00-48-21</small></div>
  <div class="why"><b>RR 31 /mnt ↑</b> · ≥ 30 selama 1 mnt 20 dtk</div>
  <div class="meta"><span>Data 1 dtk lalu</span><span>Sinyal baik</span><span>Urutan 2 di antrean</span></div>
  <div class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Buka detail bed →</span></div>
</div>"""


def a_tile(b):
    bid, cls, badge, _ = b
    sel = " sel" if bid == SELECTED else ""

    return (f'<div class="cb s-{cls} glass2{sel}"><div class="h"><span class="id">{bid}</span>{ob(badge)}</div>'
            f'<div class="st">{glyph(cls)}{WORD[cls]}</div></div>')


def a(mode):
    t = [a_tile(b) for b in BEDS2]
    pop = A_POP
    body = f"""{topbar()}
<div class="wrap">{queue()}
  <section class="panel glass">
    <div class="rhd"><h2>Denah Lantai 3</h2><div class="cnt"><b>7/8</b>bed terpantau</div></div>
    <div class="rooms">
      <div class="room"><span class="rlab">Kamar 301</span>{t[0]}{t[1]}{t[2]}{t[3]}</div>
      <div class="room"><span class="rlab">Kamar 302</span>{t[4]}{t[5]}{t[6]}{t[7]}</div>
    </div>
    <div class="corr"><span>Koridor</span><span class="pill glass2" style="height:32px;text-transform:none;letter-spacing:0"><b>Nurse station</b></span></div>
    <div class="lgwrap"><span class="hint">Klik bed untuk nama pasien dan detail · angka bulat = urutan di antrean</span>{legend()}</div>
  </section>
</div>
{pop}"""
    return doc(f"R2 · A · Sekilas · {mode}", STATUS_CSS + COMMON_CSS + A_CSS, body, mode)


# ------------------------------------------------------------------ B · Denah + panel bed (signature)
B_CSS = """
.wrap{grid-template-columns:1fr 640px}
.rcol{display:flex;flex-direction:column;gap:16px;min-width:0}
.map{padding:20px 20px 16px}
.map .rhd{padding:0 4px 12px}
.plan{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.room{position:relative;border-radius:22px;border:1px solid var(--hair);padding:34px 12px 12px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;row-gap:22px;column-gap:10px}
.room .rlab{position:absolute;top:11px;left:16px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.lamp{position:relative;height:88px;border-radius:14px;padding:10px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center}
.lamp:after{content:"";position:absolute;left:22%;right:22%;height:6px;border-radius:3px;background:currentColor;opacity:.22}
.lamp.up:after{top:6px}.lamp.dn:after{bottom:6px}
.lamp .id{font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1;color:var(--tx)}
.lamp .st{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;line-height:1.15}
.lamp.s-pra .id,.lamp.s-cb .id{color:#fff}
.lamp.s-empty .id{color:var(--tx3)}
.lamp .ob{position:absolute;top:-8px;right:-8px;width:22px;height:22px;font-size:12px;box-shadow:0 0 0 2px var(--bg)}
.map .corr{margin-top:12px;height:40px}
.map .lgd{margin-top:12px;gap:6px}.map .lgc{height:26px;padding:0 8px;font-size:12px;border-radius:8px}
.insp{flex:1;padding:20px 24px;gap:13px}
.insp .ih{display:flex;align-items:center;gap:14px}
.insp .ih .big{font-size:46px;font-weight:700;letter-spacing:-.04em;line-height:1}
.insp .ih .k{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.insp .who{font-size:20px;font-weight:600}
.insp .who small{display:block;font-size:15px;font-weight:400;color:var(--tx2);margin-top:4px}
.insp .vit{display:grid;grid-template-columns:170px 1fr;gap:20px;align-items:center;padding:14px 18px;border-radius:20px;background:var(--hiSoft)}
.insp .rr{font-size:58px;font-weight:600;letter-spacing:-.04em;line-height:.95;font-feature-settings:'tnum' 1}
.insp .rr small{font-size:17px;font-weight:500;letter-spacing:0;color:var(--tx2);margin-left:4px}
.insp .rrc{font-size:14px;color:var(--hiText);font-weight:600;margin-top:8px;line-height:1.35}
.insp .meta{display:flex;gap:18px;font-size:13px;color:var(--tx3)}
.insp .tl{display:flex;flex-direction:column;gap:0;border-top:1px solid var(--hair)}
.insp .tl div{display:grid;grid-template-columns:64px 1fr;gap:12px;padding:9px 2px;border-bottom:1px solid var(--hair);font-size:14px;color:var(--tx2)}
.insp .tl div b{color:var(--tx);font-weight:600}
.insp .tl span:first-child{font-feature-settings:'tnum' 1;color:var(--tx3)}
.insp .acts{display:flex;gap:10px;margin-top:auto}
.insp .btn{height:50px;font-size:16px}
"""


def b_lamp(b, row):
    bid, cls, badge, _ = b
    sel = " sel" if bid == SELECTED else ""
    return (f'<div class="lamp {row} s-{cls} glass2{sel}">{ob(badge)}<span class="id">{bid}</span>'
            f'<span class="st">{glyph(cls, 13)}{WORD[cls]}</span></div>')


def b(mode):
    rows = ["up", "up", "dn", "dn"]
    l = [b_lamp(bb, rows[i % 4]) for i, bb in enumerate(BEDS2)]
    body = f"""{topbar()}
<div class="wrap">{queue()}
  <div class="rcol">
    <section class="panel glass map">
      <div class="rhd"><h2>Denah Lantai 3</h2><div class="cnt"><b>7/8</b>bed terpantau</div></div>
      <div class="plan">
        <div class="room"><span class="rlab">Kamar 301</span>{l[0]}{l[1]}{l[2]}{l[3]}</div>
        <div class="room"><span class="rlab">Kamar 302</span>{l[4]}{l[5]}{l[6]}{l[7]}</div>
      </div>
      <div class="corr"><span>Koridor</span><span class="pill glass2" style="height:28px;text-transform:none;letter-spacing:0;font-size:13px"><b>Nurse station</b></span></div>
      <div class="hint" style="margin-top:10px">Klik bed untuk nama pasien dan detail · angka bulat = urutan di antrean</div>
    </section>
    <section class="panel glass insp">
      <div class="ih"><div><div class="k">Bed dipilih</div><div class="big">302-C</div></div><span class="tag hi" style="height:34px;font-size:15px">{tri(s=15)}Kritis · urutan 2</span><span class="sp"></span><span class="x">×</span></div>
      <div class="who">Ny. D.A. · 60<small>PPOK eksaserbasi · No. RM 00-48-21 · ICD-10 J44.1 · data 1 dtk lalu · sinyal baik</small></div>
      <div class="vit">
        <div><div class="rr">31<small>/mnt ↑</small></div><div class="rrc">≥ 30 selama<br>1 mnt 20 dtk</div></div>
        {spark(330, 70)}
      </div>
      <div class="tl">
        <div><span>10.51.40</span><span><b>Kritis</b> · RR ≥ 30 selama 1 mnt · berbunyi 1×</span></div>
        <div><span>10.44.10</span><span><b>Waspada</b> · RR > 20 selama 2 mnt</span></div>
      </div>
      <div class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Buka detail bed →</span></div>
    </section>
  </div>
</div>"""
    return doc(f"R2 · B · Denah + panel · {mode}", STATUS_CSS + COMMON_CSS + B_CSS, body, mode)


# ------------------------------------------------------------------ C · Pita kamar (craft)
C_CSS = """
.wrap{grid-template-columns:1fr 620px}
.panel{gap:14px}
.panel .rhd{padding:0 4px 0}
.tally .lgd{gap:6px}.tally .lgc{height:30px}
.room{position:relative;border-radius:22px;border:1px solid var(--hair);padding:12px}
.room .rl{display:flex;justify-content:space-between;align-items:baseline;padding:2px 6px 10px}
.room .rl b{font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.room .rl span{font-size:13px;color:var(--tx3)}
.strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.cb{position:relative;height:132px;border-radius:16px;padding:12px 12px 12px;display:flex;flex-direction:column;gap:6px}
.cb .h{display:flex;align-items:center;justify-content:space-between}
.cb .id{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1}
.cb .gl{margin-top:auto;height:22px;display:flex;align-items:center}
.cb .st{font-size:14px;font-weight:600;line-height:1.15}
.cb .sub{font-size:12px;color:var(--tx3);font-feature-settings:'tnum' 1;white-space:nowrap}
.band{position:relative;margin-top:16px;border-radius:18px;padding:18px 20px;display:grid;grid-template-columns:1fr 230px;grid-template-rows:auto auto;gap:14px 20px;
  background:var(--glass2);border:1px solid var(--edge);box-shadow:inset 0 0 0 1.5px var(--hiEdge),var(--shadow)}
.band:before{content:"";position:absolute;top:-9px;left:calc((100% - 30px) / 4 * 2.5 + 20px - 9px);width:16px;height:16px;transform:rotate(45deg);background:var(--glass2);border-left:1.5px solid var(--hiEdge);border-top:1.5px solid var(--hiEdge);border-radius:3px 0 0 0}
.band .who{font-size:19px;font-weight:600;display:flex;align-items:center;gap:10px}
.band .who small{display:block;font-size:14px;font-weight:400;color:var(--tx2);margin-top:4px}
.band .rr{font-size:44px;font-weight:600;letter-spacing:-.03em;line-height:1;font-feature-settings:'tnum' 1}
.band .rr small{font-size:15px;font-weight:500;color:var(--tx2);letter-spacing:0;margin-left:3px}
.band .rrc{font-size:13px;color:var(--hiText);font-weight:600;margin-top:6px}
.band .acts{grid-column:1/3;display:flex;gap:10px;align-items:center}
.band .acts .btn{height:44px;font-size:15px}
.band .acts .hint{margin-left:auto}
.panel .corr{margin-top:auto}
"""


# Revisi pengguna atas C: Kritis = merah penuh, Pra-alarm = merah bening (tint + garis merah tegas).
C_ALT_CSS = """
.s-kr{background:var(--hi)!important;color:#fff;border-color:transparent!important;box-shadow:0 12px 26px rgba(215,38,43,.34)}
.s-kr .st,.s-kr .sub,.s-kr .id{color:#fff}
.s-kr .ob{background:#fff;color:#C01F24}
.cb.s-kr.sel{box-shadow:0 0 0 4px var(--bg),0 0 0 7px var(--sel)!important}
.s-pra{background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2)!important;color:var(--tx);box-shadow:inset 0 0 0 3px var(--hi),var(--shadow)}
.s-pra .st,.s-pra .sub{color:var(--hiText)}
.s-pra .ob{background:var(--hi);color:#fff}
.lgc.s-kr{background:var(--hi)!important;color:#fff;box-shadow:none}
.lgc.s-pra{background:var(--hiSoft)!important;color:var(--hiText);box-shadow:inset 0 0 0 1.5px var(--hi)}
"""


def c_tile(b, alt=False):
    bid, cls, badge, sub = b
    sel = " sel" if bid == SELECTED else ""
    return (f'<div class="cb s-{cls} glass2{sel}"><div class="h"><span class="id">{bid}</span>{ob(badge)}</div>'
            f'<div class="gl">{glyph(cls, 18, alt)}</div><div class="st">{WORD[cls]}</div><div class="sub">{sub}</div></div>')


def c(mode, alt=False):
    t = [c_tile(bb, alt) for bb in BEDS2]
    counts = {"cb": 0, "pra": 1, "kr": 1, "ws": 1, "tk": 1, "ok": 2, "away": 1, "empty": 1}
    body = f"""{topbar()}
<div class="wrap">{queue()}
  <section class="panel glass">
    <div class="rhd"><h2>Denah Lantai 3</h2><div class="cnt"><b>7/8</b>bed terpantau</div></div>
    <div class="tally">{legend(counts, alt)}</div>
    <div class="room"><div class="rl"><b>Kamar 301</b><span>3 pasien</span></div><div class="strip">{t[0]}{t[1]}{t[2]}{t[3]}</div></div>
    <div class="room"><div class="rl"><b>Kamar 302</b><span>4 pasien</span></div><div class="strip">{t[4]}{t[5]}{t[6]}{t[7]}</div>
      <div class="band">
        <div><div class="who">Ny. D.A. · 60</div><div class="who"><small>PPOK eksaserbasi<br>No. RM 00-48-21 · data 1 dtk lalu</small></div>
          <div style="margin-top:14px"><span class="rr">31<small>/mnt ↑</small></span><div class="rrc">≥ 30 selama 1 mnt 20 dtk</div></div></div>
        <div>{spark(230, 92)}</div>
        <div class="acts"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Buka detail bed →</span><span class="hint">Klik bed lain untuk ganti</span></div>
      </div>
    </div>
    <div class="corr"><span>Koridor</span><span class="pill glass2" style="height:32px;text-transform:none;letter-spacing:0"><b>Nurse station</b></span></div>
  </section>
</div>"""
    if alt:
        return doc(f"R2 · C · Pita kamar · rev merah · {mode}", STATUS_CSS + COMMON_CSS + C_CSS + C_ALT_CSS, body, mode)
    return doc(f"R2 · C · Pita kamar · {mode}", STATUS_CSS + COMMON_CSS + C_CSS, body, mode)


if __name__ == "__main__":
    for name, fn in (("a", a), ("b", b), ("c", c)):
        for mode in ("light", "dark"):
            p = HERE / f"{name}-{mode}.html"
            p.write_text(fn(mode), encoding="utf-8")
            print("wrote", p.name)
    for mode in ("light", "dark"):
        p = HERE / f"c2-{mode}.html"
        p.write_text(c(mode, alt=True), encoding="utf-8")
        print("wrote", p.name)
