"""Ronde 3 · Kritik dan perbaikan pada C′ (Pita kamar, Kritis merah penuh, Pra-alarm merah bening).

Perbaikan yang disetujui pengguna (semua):
  1  Code Blue beda jelas dari Kritis: merah tua + bingkai putih + kata CODE BLUE kapital
  2  Pra-alarm tetap bening, tetapi hitung mundur "CB 9 dtk" besar + garis tebal berdenyut (mati saat reduced motion)
  3  Antrean ikut aturan warna baru: item Kritis merah penuh
  4  Versi 24 bed: tile rapat, satu baris per kamar
  5  Keadaan: antrean kosong, gangguan (data basi, kiriman gagal, mengirim), memuat
  6  Keterbacaan: kata status 16 px, keterangan 14 px
  7  Tampilan ringan: panel solid tanpa blur untuk PC lambat
  8  Uji 1366×768
  9  Pita detail punya tombol Tutup, fokus keyboard terlihat
  10 Ruang kosong dipakai: denah 24 bed mengisi kolom kanan

Mengambil token, ikon, dan CSS dari designs/round-2/build.py.
"""
import importlib.util
import pathlib

HERE = pathlib.Path(__file__).parent
_spec = importlib.util.spec_from_file_location("r2", HERE.parent / "round-2" / "build.py")
R2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R2)

TOKENS = R2.TOKENS
TOKENS["light"] += "--focus:#2F6FED;--solidA:#F3F6FA;"
TOKENS["dark"] += "--focus:#8AB4FF;--solidA:#0D1420;"

# Penyesuaian kontras WCAG AA (Phase 3, disetujui pengguna 25 Nov 2026): glow latar diredupkan dan
# token teks/status digeser sedikit, supaya semua teks >= 4,5:1 di area latar mana pun
# (cek: python designs/system/kontras.py). Ditulis sebagai penimpa supaya HTML ronde 1c dan 2 tetap
# seperti saat dipilih. Berlaku untuk ronde 3 ke atas dan design system.
AA_FIX = {
    "light": "--glowA:rgba(150,196,245,.50);--glowC:rgba(255,190,180,.32);"
             "--tx3:#4D5767;--hiText:#BB1E23;--md:#8E5400;--ok:#1C7642;",
    "dark": "--glowA:rgba(54,110,190,.22);--glowC:rgba(255,80,70,.15);"
            "--tx3:#A3AEBE;--hiText:#FF9EA0;--lo:#95C7FF;--hi:#D42F33;",
}
for _m in AA_FIX:
    TOKENS[_m] += AA_FIX[_m]
# Merah di lencana putih (warna tetap di kedua mode) ikut nilai --hiText terang yang baru.
RED_ON_WHITE_OLD, RED_ON_WHITE = "#C01F24", "#BB1E23"

oct_, tri, circ, off, okdot = R2.oct_, R2.tri, R2.circ, R2.off, R2.okdot
siren, pause, dash, ticks, spark = R2.siren, R2.pause, R2.dash, R2.ticks, R2.spark
PHONE, SOUND, COIL = R2.PHONE, R2.SOUND, R2.COIL


def doc(*args, **kwargs):
    return R2.doc(*args, **kwargs).replace(RED_ON_WHITE_OLD, RED_ON_WHITE)


WORD = dict(R2.WORD, load="Menunggu data")


def spinner(c="var(--tx3)", s=16):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" style="fill:none;stroke:var(--hair)" stroke-width="2.2"/>'
            f'<path d="M8 2a6 6 0 0 1 6 6" style="fill:none;stroke:{c}" stroke-width="2.2" stroke-linecap="round"/></svg>')


def gly(cls, s=18):
    if cls == "load":
        return spinner(s=s - 2)
    return R2.glyph(cls, s, alt=True)


def warn_ic(c="var(--md)", s=18):
    return circ(c, s)


CHECK = '<svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" style="fill:var(--okSoft)"/><path d="M10 17.5l5 5 9-10" style="fill:none;stroke:var(--ok)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# ------------------------------------------------------------------ CSS ronde 3
R3_CSS = """
/* 1 · Code Blue: merah tua, bingkai putih, kata kapital */
.s-cb{background:var(--cbBg)!important;color:#fff;box-shadow:inset 0 0 0 3px #fff,0 0 0 1.5px var(--cbBg),0 12px 26px rgba(122,14,19,.38)!important}
.s-cb .st{text-transform:uppercase;letter-spacing:.05em;font-weight:800}
.s-cb .id,.s-cb .sub,.s-cb .cd{color:#fff}
.s-cb .ob{background:#fff;color:var(--cbBg)}
.lgc.s-cb:not(.zero){background:var(--cbBg)!important;color:#fff;box-shadow:inset 0 0 0 2px #fff,0 0 0 1px var(--cbBg)}
/* 2 · Pra-alarm bening + hitung mundur + denyut */
.s-pra{box-shadow:inset 0 0 0 4px var(--hi),var(--shadow)!important;animation:prp 1.6s ease-in-out infinite}
@keyframes prp{50%{box-shadow:inset 0 0 0 7px var(--hi),var(--shadow)}}
@media (prefers-reduced-motion:reduce){.s-pra{animation:none}}
.cd{font-size:20px;font-weight:800;color:var(--hiText);font-feature-settings:'tnum' 1;line-height:1.05;white-space:nowrap}
/* 9 · fokus keyboard */
.focus{box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--focus)!important}
.s-load{background:var(--hair)!important;border:1px dashed var(--hair)!important;box-shadow:none!important}
.s-load .st,.s-load .sub{color:var(--tx3)}
.s-load .id{color:var(--tx2)}
.lgc.s-load{background:var(--hair);color:var(--tx2)}

/* tile lega (≤ 8 bed) — 6 · kata status 16 px, keterangan 14 px */
.room{position:relative;border-radius:22px;border:1px solid var(--hair);padding:12px}
.room .rl{display:flex;justify-content:space-between;align-items:baseline;padding:2px 6px 10px}
.room .rl b{font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.room .rl span{font-size:13px;color:var(--tx3)}
.strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.cb{position:relative;height:150px;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:5px;min-width:0}
.cb .h{display:flex;align-items:center;justify-content:space-between}
.cb .id{font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1}
.cb .gl{margin-top:auto;height:24px;display:flex;align-items:center}
.cb .st{font-size:16px;font-weight:700;line-height:1.15}
.cb .sub{font-size:14px;color:var(--tx3);line-height:1.2;white-space:nowrap}

/* tile rapat (24 bed, 1366) */
.rows{display:flex;flex-direction:column;gap:8px}
.rr{display:grid;grid-template-columns:62px repeat(4,minmax(0,1fr));gap:8px}
.rr .rn{display:flex;flex-direction:column;justify-content:center;padding-left:6px}
.rr .rn b{font-size:19px;font-weight:700;letter-spacing:-.01em}
.rr .rn span{font-size:12px;color:var(--tx3)}
.cbd{position:relative;height:78px;border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
.cbd .h{display:flex;align-items:center;gap:6px}
.cbd .id{font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1}
.cbd .ob{margin-left:auto;width:20px;height:20px;font-size:11px}
.cbd .st{font-size:14px;font-weight:700;line-height:1.1;white-space:nowrap}
.cbd .sub{font-size:13px;color:var(--tx3);line-height:1.1;white-space:nowrap}
.cbd .cd{font-size:15px}
.cbd.s-cb .st{font-size:13px}

/* pita detail (band) — 9 · tombol Tutup */
.band{position:relative;margin-top:14px;border-radius:18px;padding:18px 20px;display:grid;grid-template-columns:1fr 230px;grid-template-rows:auto auto;gap:14px 20px;
  background:var(--glass2);border:1px solid var(--edge);box-shadow:inset 0 0 0 1.5px var(--hiEdge),var(--shadow)}
.band:before{content:"";position:absolute;top:-9px;left:var(--notch);width:16px;height:16px;transform:rotate(45deg);background:var(--glass2);border-left:1.5px solid var(--hiEdge);border-top:1.5px solid var(--hiEdge);border-radius:3px 0 0 0}
.band .who{font-size:19px;font-weight:600}
.band .who small{display:block;font-size:14px;font-weight:400;color:var(--tx2);margin-top:4px;line-height:1.35}
.band .rrv{margin-top:12px;font-size:44px;font-weight:600;letter-spacing:-.03em;line-height:1;font-feature-settings:'tnum' 1}
.band .rrv small{font-size:15px;font-weight:500;color:var(--tx2);letter-spacing:0;margin-left:3px}
.band .rrc{font-size:14px;color:var(--hiText);font-weight:600;margin-top:6px}
.band .acts{grid-column:1/3;display:flex;gap:10px;align-items:center}
.band .acts .btn{height:44px;font-size:15px}
.band .acts .close{margin-left:auto}

/* 3 · item antrean Kritis merah penuh */
.ri.kr{background:var(--hi)!important;color:#fff;border-color:transparent!important;box-shadow:0 14px 30px rgba(215,38,43,.30)!important}
.ri.kr .lv,.ri.kr .bid,.ri.kr .pt,.ri.kr .pt b,.ri.kr .why,.ri.kr .why small,.ri.kr .why b{color:#fff}
.ri.kr .ordb{background:#fff!important;color:#C01F24!important}
.btn.onred{background:#fff;color:#B81D22}
.btn.onred2{border:1.5px solid rgba(255,255,255,.75);color:#fff}
/* item Pra-alarm ringkas (saat ada Code Blue di atasnya) */
.ri.prar{background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 3px var(--hi),var(--shadow)}
.ri.prar .lv{color:var(--hiText)}
.ri.prar .why{display:flex;align-items:center;gap:14px}
.ri.prar .ticks i{width:7px;height:20px;border-radius:4px}
.ri.prar .btn.call{height:48px;font-size:15px;padding:0 18px;box-shadow:none}
.ri.prar .btn.hold{height:48px;font-size:14px;padding:0 14px}
/* kartu Code Blue besar */
.qi.cbk{background:var(--cbBg);color:#fff;box-shadow:inset 0 0 0 4px #fff,0 0 0 1.5px var(--cbBg),0 20px 44px rgba(122,14,19,.35)}
.qi.cbk .lv{color:#fff;font-size:16px;letter-spacing:.1em}
.qi.cbk .qh .s{color:rgba(255,255,255,.85)}
.qi.cbk .id{display:flex;align-items:flex-end;gap:26px;margin:14px 0 0}
.qi.cbk .bedbig{font-size:104px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.qi.cbk .pt{font-size:19px;line-height:1.4;padding-bottom:4px;color:rgba(255,255,255,.92)}
.qi.cbk .pt b{color:#fff}
.qi.cbk .why{display:flex;align-items:center;gap:24px;margin:16px 0;padding:14px 18px;border-radius:18px;background:rgba(255,255,255,.12)}
.qi.cbk .why .r{font-size:34px;font-weight:600;letter-spacing:-.02em;font-feature-settings:'tnum' 1}
.qi.cbk .why .r small{font-size:16px;font-weight:500;letter-spacing:0;margin-left:6px;opacity:.9}
.qi.cbk .why .t{font-size:15px;line-height:1.35;opacity:.95}
.qi.cbk .acts{display:flex;gap:12px}
.qi.cbk .btn{height:64px;font-size:19px;padding:0 30px}
/* 5 · status kiriman */
.btn.sending{background:var(--hair);color:var(--tx2);gap:10px}
.ri.kr .btn.sending{background:rgba(255,255,255,.18);color:#fff}
.sendnote{font-size:13px;color:inherit;opacity:.9}
.fail{display:flex;align-items:center;gap:16px;margin-top:14px;padding:14px 18px;border-radius:18px;background:var(--mdSoft);box-shadow:inset 0 0 0 1.5px var(--mdDot)}
.fail .t{font-size:16px;line-height:1.35}.fail .t b{display:block;font-size:17px}
.fail .btn{height:44px;font-size:15px;margin-left:auto}
.pillwarn{color:var(--md)!important}.pillwarn b{color:var(--md)!important}
.mdot{width:8px;height:8px;border-radius:50%;background:var(--mdDot);display:inline-block}
/* 5 · antrean kosong dan memuat */
.calm{border-radius:28px;padding:34px 34px 30px;display:flex;flex-direction:column;gap:14px}
.calm .h{display:flex;align-items:center;gap:16px}
.calm h2{font-size:36px;font-weight:600;letter-spacing:-.02em}
.calm p{font-size:18px;color:var(--tx2);line-height:1.45}
.calm .last{margin-top:10px;border-top:1px solid var(--hair)}
.calm .last div{display:grid;grid-template-columns:70px 1fr;gap:12px;padding:12px 2px;border-bottom:1px solid var(--hair);font-size:15px;color:var(--tx2)}
.calm .last div span:first-child{color:var(--tx3);font-feature-settings:'tnum' 1}
.calm .last div b{color:var(--tx);font-weight:600}
.calm .k{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3);margin-top:6px}
.skel{height:76px;border-radius:24px;background:var(--hair);opacity:.7}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chips span{height:32px;padding:0 12px;border-radius:10px;background:var(--hair);display:inline-flex;align-items:center;font-size:15px;font-weight:600}
.lgc.zero.s-kr,.lgc.zero.s-pra,.lgc.zero.s-cb{background:transparent!important;color:var(--tx3)!important;box-shadow:inset 0 0 0 1px var(--hair)!important}
.cb.s-kr .sub,.cbd.s-kr .sub,.cb.s-cb .sub,.cbd.s-cb .sub{color:#fff}
/* 24 bed: antrean lebih padat */
.dense .qi.cbk{padding:18px 24px}
.dense .qi.cbk .bedbig{font-size:84px}
.dense .qi.cbk .why{margin:12px 0;padding:10px 16px}
.dense .qi.cbk .why .r{font-size:28px}
.dense .qi.cbk .btn{height:54px;font-size:17px}
.dense .ri{padding:12px 20px;grid-template-columns:170px 110px 230px 1fr auto}
.dense .ri .bid{font-size:34px}.dense .ri.ws .bid,.dense .ri.tk .bid{font-size:30px}
.ri.prar .why{white-space:nowrap}
.ri.prar .why small{display:block;font-size:14px;color:var(--hiText);font-weight:700}
"""

LIGHT_CSS = """
body{background:linear-gradient(180deg,var(--bgTop) 0%,var(--bg) 46%)!important}
.glass,.glass2,.pop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.glass{background:var(--solidA)!important}
.glass2{background:var(--solid)!important}
.cb.s-kr,.cbd.s-kr{background:var(--hi)!important}
.cb.s-cb,.cbd.s-cb{background:var(--cbBg)!important}
.cb.s-pra,.cbd.s-pra{background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--solid)!important}
.cb.s-ws,.cbd.s-ws{background:linear-gradient(var(--mdSoft),var(--mdSoft)),var(--solid)!important}
.cb.s-empty,.cbd.s-empty{background:transparent!important}
.band{backdrop-filter:none!important;background:var(--solid)!important}
.band:before{background:var(--solid)!important}
"""

S1366_CSS = """
body{width:1366px!important;height:768px!important}
.top{left:16px;right:16px;top:12px;height:60px;gap:12px;padding:0 10px 0 12px;border-radius:20px}
.top .logo{font-size:18px;gap:8px}.top .logo .mk{width:34px!important;height:34px!important}
.top .ward{font-size:14px}
.top .nav a{height:34px;padding:0 12px;font-size:14px}
.top .pill{height:34px;padding:0 11px;font-size:13px;gap:6px}
.clock{font-size:24px;padding:0 6px}
.wrap{left:16px;right:16px;top:84px;bottom:16px;gap:14px;grid-template-columns:1fr 470px!important}
.left{gap:10px}
.hd{padding:2px 6px 0}.hd h1{font-size:22px}.hd span{font-size:13px}
.qi{border-radius:22px;padding:16px 20px}
.qi.pra .id{margin-top:10px;gap:18px}
.qi.pra .bedbig{font-size:84px}
.qi.pra .pt{font-size:16px}
.qi.pra .why{margin:12px 0;padding:10px 14px;gap:16px;border-radius:16px}
.qi.pra .why .r{font-size:28px}.qi.pra .why .r small{font-size:14px}
.qi.pra .why .cdt{font-size:13px}.qi.pra .why .cdt b{font-size:22px}
.qi.pra .ticks{gap:3px}.qi.pra .ticks i{width:8px;height:22px}
.qi.pra .btn.call{height:56px;font-size:17px;padding:0 22px}
.qi.pra .btn.hold{height:56px;font-size:14px;padding:0 16px}
.ri{border-radius:18px;padding:10px 14px;grid-template-columns:150px 92px 1fr 1fr auto;gap:10px}
.ri .bid{font-size:30px}.ri.ws .bid,.ri.tk .bid{font-size:26px}
.ri .pt{font-size:13px}.ri .why{font-size:14px}.ri .why small{font-size:12px}
.ri .lv{font-size:12px}
.ri .btn{height:40px;font-size:14px;padding:0 14px}
.panel{border-radius:24px;padding:16px}
.rhd{padding:0 2px 10px}.rhd h2{font-size:18px}.rhd .cnt b{font-size:22px}
.tally .lgc{height:26px;font-size:12px;padding:0 8px}
.room2{position:relative;border-radius:18px;border:1px solid var(--hair);padding:8px}
.room2 .rl{display:flex;justify-content:space-between;padding:0 4px 6px;font-size:12px;color:var(--tx3)}
.room2 .rl b{font-weight:600;letter-spacing:.1em}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cbd{height:70px}
"""


# ------------------------------------------------------------------ bagian
def topbar(hub='<span class="dot"></span><b>Live</b> · 8 hub', terp="7/8", clock="10.53", hubwarn=False, extra=""):
    cls = "pill glass2 pillwarn" if hubwarn else "pill glass2"
    return f"""
<header class="top glass">
  <div class="logo"><span class="mk glass2" style="width:40px;height:40px;border-radius:12px">{COIL}</span>SiagaBed</div>
  <div class="ward"><b>Bangsal Melati</b> · Lantai 3</div>
  <nav class="nav glass2"><a class="on">Bangsal</a><a>Log</a><a>Bantuan</a><a>Tim</a></nav>
  <div class="sp"></div>{extra}
  <span class="pill glass2"><b>Ns. Rina</b> · jaga</span>
  <span class="pill glass2">{SOUND}<b>Suara aktif</b></span>
  <span class="{cls}">{hub}</span>
  <span class="pill glass2"><b>{terp}</b> terpantau</span>
  <span class="clock">{clock}</span>
</header>"""


def ob(badge):
    return f'<span class="ob">{badge}</span>' if badge else ""


def tile(b, sel=False, dense=False):
    bid, cls, badge, sub = b
    s = " sel" if sel else ""
    if cls == "pra":
        extra = f'<div class="cd">{sub}</div>'
    elif cls == "cb":
        extra = f'<div class="sub">{sub}</div>'
    else:
        extra = f'<div class="sub">{sub}</div>' if sub else ""
    if dense:
        return (f'<div class="cbd s-{cls} glass2{s}"><div class="h">{gly(cls, 16)}<span class="id">{bid}</span>{ob(badge)}</div>'
                f'<div class="st">{WORD[cls]}</div>{extra}</div>')
    return (f'<div class="cb s-{cls} glass2{s}"><div class="h"><span class="id">{bid}</span>{ob(badge)}</div>'
            f'<div class="gl">{gly(cls, 20)}</div><div class="st">{WORD[cls]}</div>{extra}</div>')


ORDER = ["cb", "pra", "kr", "ws", "tk", "ok", "away", "empty", "load"]


def tally(beds):
    counts = {}
    for b in beds:
        counts[b[1]] = counts.get(b[1], 0) + 1
    out = []
    for c in ORDER:
        n = counts.get(c, 0)
        if c == "load" and n == 0:
            continue
        zero = " zero" if n == 0 else ""
        g = gly(c, 14)
        if n == 0 and c == "cb":
            g = siren("var(--tx3)", 16)
        elif n == 0 and c == "pra":
            g = oct_("var(--tx3)", "var(--bg)", 16)
        elif n == 0 and c == "kr":
            g = tri("var(--tx3)", 15)
        out.append(f'<span class="lgc s-{c}{zero}">{g}<span class="n">{n}</span>{WORD[c]}</span>')
    return '<div class="tally"><div class="lgd">' + "".join(out) + "</div></div>"


def band(notch, focus=True, sending=False):
    f = " focus" if focus else ""
    check = ('<span class="btn sending">' + spinner("var(--tx2)") + 'Mengirim ke hub…</span>') if sending else '<span class="btn ink">Sudah dicek</span>'
    return f"""<div class="band" style="--notch:{notch}">
  <div><div class="who">Ny. D.A. · 60<small>PPOK eksaserbasi<br>No. RM 00-48-21 · data 1 dtk lalu</small></div>
    <div class="rrv">31<small>/mnt ↑</small></div><div class="rrc">≥ 30 selama 1 mnt 20 dtk</div></div>
  <div>{spark(230, 92)}</div>
  <div class="acts">{check}<span class="btn ghost{f}">Buka detail bed →</span><span class="btn ghost close">× Tutup</span></div>
</div>"""


NOTCH_LEGA = "calc((100% - 30px) / 4 * 2.5 + 20px - 8px)"
NOTCH_RAPAT = "calc(70px + (100% - 94px) / 4 * 2.5 + 16px - 8px)"


def rooms_lega(beds, sel=None, band_html=""):
    out = []
    for i, name in enumerate(("301", "302")):
        bs = beds[i * 4:(i + 1) * 4]
        n = sum(1 for b in bs if b[1] not in ("empty",))
        tiles = "".join(tile(b, b[0] == sel) for b in bs)
        bh = band_html if sel and any(b[0] == sel for b in bs) else ""
        out.append(f'<div class="room"><div class="rl"><b>Kamar {name}</b><span>{n} pasien</span></div><div class="strip">{tiles}</div>{bh}</div>')
    return "".join(out)


def rooms_rapat(beds, sel=None, band_html=""):
    out = []
    for i in range(len(beds) // 4):
        bs = beds[i * 4:(i + 1) * 4]
        name = bs[0][0][:3]
        n = sum(1 for b in bs if b[1] != "empty")
        tiles = "".join(tile(b, b[0] == sel, dense=True) for b in bs)
        out.append(f'<div class="rr"><div class="rn"><b>{name}</b><span>{n} pasien</span></div>{tiles}</div>')
        if sel and any(b[0] == sel for b in bs):
            out.append(band_html)
    return '<div class="rows">' + "".join(out) + "</div>"


def panel(title_cnt, body, corridor=True):
    corr = ('<div class="corr" style="margin-top:auto"><span>Koridor</span><span class="pill glass2" '
            'style="height:32px;text-transform:none;letter-spacing:0"><b>Nurse station</b></span></div>') if corridor else ""
    return f"""<section class="panel glass" style="gap:14px">
    <div class="rhd" style="padding:0 4px"><h2>Denah Lantai 3</h2><div class="cnt"><b>{title_cnt}</b>bed terpantau</div></div>
    {body}{corr}
  </section>"""


# ---- item antrean
def pra_card(cd="9 dtk", on=9, failed=False):
    acts = (f'<div class="acts"><span class="btn call">{PHONE}Panggil Code Blue sekarang</span>'
            f'<span class="btn hold">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></span></div>')
    if failed:
        acts = (f'<div class="acts"><span class="btn call">{PHONE}Panggil Code Blue sekarang</span></div>'
                f'<div class="fail">{warn_ic(s=22)}<div class="t"><b>Pembatalan belum sampai ke hub</b>Batalkan di bedhead 301-B. Hitung mundur tetap berjalan sampai hub menerima.</div>'
                f'<span class="btn ghost">Kirim ulang</span></div>')
    return f"""<div class="qi pra">
      <div class="qh"><span class="ordb" style="background:var(--hi);color:#fff">1</span>{oct_()}<span class="lv">Pra-alarm</span><span class="s">mulai 10.53.07 · bunyi berulang</span></div>
      <div class="id"><span class="bedbig">301-B</span><span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span></div>
      <div class="why"><span class="r">26 dtk<small>tanpa napas efektif</small></span><span class="sp"></span>{ticks(on)}<span class="cdt">Code Blue otomatis<b>{cd}</b></span></div>
      {acts}
    </div>"""


def row_kr(n="2", sending=False):
    acts = ('<span class="acts"><span class="btn sending">' + spinner("#fff") + 'Mengirim ke hub…</span></span>') if sending else \
        '<span class="acts"><span class="btn onred">Sudah dicek</span><span class="btn onred2">Lihat tren</span></span>'
    return f"""<div class="ri kr">
      <span class="lv"><span class="ordb">{n}</span>{tri("#fff")}Kritis</span>
      <span class="bid">302-C</span>
      <span class="pt"><b>Ny. D.A.</b> · 60<br>PPOK eksaserbasi</span>
      <span class="why"><b>RR 31 /mnt ↑</b><small>≥ 30 selama 1 mnt 20 dtk</small></span>
      {acts}
    </div>"""


def row_ws(n, bid="301-C", pt="<b>Tn. A.M.</b> · 72 · Gagal jantung", why="RR 22 /mnt<small>✓ Dicek Ns. Rina 10.42 · diterima hub</small>",
           acts='<span class="btn ghost">Lihat tren</span>'):
    return f"""<div class="ri ws glass2">
      <span class="lv"><span class="ordb" style="background:var(--mdDot);color:#1B1200">{n}</span>{circ()}Waspada</span>
      <span class="bid">{bid}</span><span class="pt">{pt}</span><span class="why">{why}</span>
      <span class="acts">{acts}</span>
    </div>"""


def row_tk(n, bid="302-B", pt="<b>Tn. B.P.</b> · 81 · Stroke iskemik", why="Pad terlepas sejak 10.51<small>Periksa konektor di bedhead</small>"):
    return f"""<div class="ri tk glass2">
      <span class="lv"><span class="ordb" style="background:var(--lo);color:#fff">{n}</span>{off()}Tidak terpantau</span>
      <span class="bid">{bid}</span><span class="pt">{pt}</span><span class="why">{why}</span>
      <span class="acts"><span class="btn ghost">Buka detail</span></span>
    </div>"""


FOOT = '<div class="foot glass"><span>Tidak dibunyikan, tetap terlihat di denah:</span><span><b>302-D</b> turun dari bed · 2 mnt</span><span><b>301-D</b> bed kosong</span></div>'

B8 = [
    ("301-A", "ok", "", "RR 16"), ("301-B", "pra", "1", "CB 9 dtk"), ("301-C", "ws", "3", "RR 22 · dicek"), ("301-D", "empty", "", "siap pakai"),
    ("302-A", "ok", "", "RR 13"), ("302-B", "tk", "4", "pad terlepas"), ("302-C", "kr", "2", "RR 31 ↑"), ("302-D", "away", "", "2 mnt"),
]


def css(*extra):
    return R2.STATUS_CSS + R2.COMMON_CSS + R2.C_ALT_CSS + R3_CSS + "".join(extra)


# ------------------------------------------------------------------ frame
def utama(mode, ringan=False):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>4 item · urut paling genting</span></div>
    {pra_card()}{row_kr()}{row_ws("3")}{row_tk("4")}{FOOT}
  </section>"""
    right = panel("7/8", tally(B8) + rooms_lega(B8, "302-C", band(NOTCH_LEGA)))
    extra = '<span class="pill glass2" style="color:var(--tx3)">Tampilan ringan</span>' if ringan else ""
    body = f'{topbar(extra=extra)}<div class="wrap" style="grid-template-columns:1fr 620px">{q}{right}</div>'
    name = "Utama · tampilan ringan" if ringan else "Utama"
    return doc(f"R3 · {name} · {mode}", css(LIGHT_CSS if ringan else ""), body, mode)


B24 = B8 + [
    ("303-A", "ok", "", "RR 15"), ("303-B", "ok", "", "RR 18"), ("303-C", "ok", "", "RR 14"), ("303-D", "ok", "", "RR 17"),
    ("304-A", "ok", "", "RR 16"), ("304-B", "ws", "5", "RR 9 ↓"), ("304-C", "ok", "", "RR 12"), ("304-D", "empty", "", "siap pakai"),
    ("305-A", "ok", "", "RR 19"), ("305-B", "cb", "1", "1 mnt 12 dtk"), ("305-C", "ok", "", "RR 15"), ("305-D", "ok", "", "RR 16"),
    ("306-A", "ok", "", "RR 13"), ("306-B", "away", "", "5 mnt"), ("306-C", "ok", "", "RR 18"), ("306-D", "ok", "", "RR 14"),
]
# urutan antrean berubah karena ada Code Blue
B24 = [(b[0], b[1], {"301-B": "2", "302-C": "3", "301-C": "5", "302-B": "6", "304-B": "4"}.get(b[0], b[2]), b[3]) for b in B24]


def bed24(mode):
    cbk = f"""<div class="qi cbk">
      <div class="qh"><span class="ordb" style="background:#fff;color:var(--cbBg)">1</span>{siren("#fff", 22)}<span class="lv">CODE BLUE</span><span class="s">mulai 10.51.48 · tombol manual di kamar · ponsel Tim Code Blue berbunyi</span></div>
      <div class="id"><span class="bedbig">305-B</span><span class="pt"><b>Tn. H.S.</b> · 70<br>Sepsis, pneumonia</span></div>
      <div class="why"><span class="r">1 mnt 12 dtk<small>berjalan</small></span><span class="sp"></span><span class="t">Waktu respons dicatat saat tim<br>menekan <b>Tim sudah tiba</b></span></div>
      <div class="acts"><span class="btn onred">Tim sudah tiba</span><span class="btn onred2">Buka detail</span></div>
    </div>"""
    prar = f"""<div class="ri prar">
      <span class="lv"><span class="ordb" style="background:var(--hi);color:#fff">2</span>{oct_()}Pra-alarm</span>
      <span class="bid">301-B</span>
      <span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span>
      <span class="why"><span><b>26 dtk</b> tanpa napas efektif<small>Code Blue otomatis 9 dtk</small></span></span>
      <span class="acts"><span class="btn call">{PHONE}Panggil Code Blue</span><span class="btn hold">Batalkan</span></span>
    </div>"""
    ws_new = row_ws("4", "304-B", "<b>Tn. K.R.</b> · 77 · Pasca-ORIF femur", "RR 9 /mnt ↓<small>≤ 10 selama 2 mnt 30 dtk</small>",
                    '<span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span>')
    q = f"""<section class="left dense">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>6 item · urut paling genting</span></div>
    {cbk}{prar}{row_kr("3")}{ws_new}{row_ws("5")}{row_tk("6")}
  </section>"""
    right = panel("23/24", tally(B24) + rooms_rapat(B24, "302-C", band(NOTCH_RAPAT)), corridor=False)
    body = f'{topbar(hub="<span class=dot></span><b>Live</b> · 24 hub", terp="23/24")}<div class="wrap" style="grid-template-columns:1fr 700px">{q}{right}</div>'
    return doc(f"R3 · 24 bed · {mode}", css(), body, mode)


B8_KOSONG = [
    ("301-A", "ok", "", "RR 15"), ("301-B", "ok", "", "RR 14"), ("301-C", "ok", "", "RR 19"), ("301-D", "empty", "", "siap pakai"),
    ("302-A", "ok", "", "RR 13"), ("302-B", "ok", "", "RR 17"), ("302-C", "ok", "", "RR 19"), ("302-D", "ok", "", "RR 18"),
]


def kosong(mode):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>0 item</span></div>
    <div class="calm glass">
      <div class="h">{CHECK}<h2>Tidak ada yang perlu tindakan</h2></div>
      <p>7 pasien terpantau, 1 bed kosong. Semua data diterima kurang dari 2 dtk lalu.<br>Alarm baru akan muncul di sini dan berbunyi.</p>
      <div class="k">Kejadian terakhir shift ini</div>
      <div class="last">
        <div><span>11.05</span><span><b>302-C</b> kembali Normal · RR 19 /mnt</span></div>
        <div><span>10.58</span><span><b>301-B</b> Pra-alarm dibatalkan · pasien sudah dicek Ns. Rina · diterima hub</span></div>
        <div><span>10.56</span><span><b>302-B</b> pad terpasang lagi · terpantau</span></div>
      </div>
    </div>
  </section>"""
    right = panel("8/8", tally(B8_KOSONG) + rooms_lega(B8_KOSONG))
    body = f'{topbar(terp="8/8", clock="11.40")}<div class="wrap" style="grid-template-columns:1fr 620px">{q}{right}</div>'
    return doc(f"R3 · Antrean kosong · {mode}", css(), body, mode)


B8_GANGGUAN = [
    ("301-A", "ok", "", "RR 16"), ("301-B", "pra", "1", "CB 4 dtk"), ("301-C", "ws", "3", "RR 22 · dicek"), ("301-D", "empty", "", "siap pakai"),
    ("302-A", "tk", "5", "data basi 8 dtk"), ("302-B", "tk", "4", "pad terlepas"), ("302-C", "kr", "2", "RR 31 ↑"), ("302-D", "away", "", "2 mnt"),
]


def gangguan(mode):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>5 item · urut paling genting</span></div>
    {pra_card("4 dtk", 4, failed=True)}{row_kr(sending=True)}{row_ws("3")}{row_tk("4")}
    {row_tk("5", "302-A", "<b>Ny. L.K.</b> · 45 · DM tipe 2, selulitis", "Data basi · terakhir 10.53.02<small>Hub 302-A tidak mengirim data 8 dtk · periksa daya dan Wi-Fi hub</small>")}
  </section>"""
    right = panel("6/8", tally(B8_GANGGUAN) + rooms_lega(B8_GANGGUAN) +
                  '<div class="hint" style="padding:0 6px">Klik bed untuk nama pasien dan detail · angka bulat = urutan di antrean</div>')
    hub = '<span class="mdot"></span><b>Live</b> · 7/8 hub'
    body = f'{topbar(hub=hub, terp="6/8", clock="10.53", hubwarn=True)}<div class="wrap" style="grid-template-columns:1fr 620px">{q}{right}</div>'
    return doc(f"R3 · Gangguan · {mode}", css(), body, mode)


B8_MUAT = [
    ("301-A", "ok", "", "RR 16"), ("301-B", "load", "", "hub 301-B"), ("301-C", "ws", "1", "RR 22"), ("301-D", "empty", "", "siap pakai"),
    ("302-A", "load", "", "hub 302-A"), ("302-B", "ok", "", "RR 15"), ("302-C", "ok", "", "RR 20"), ("302-D", "load", "", "hub 302-D"),
]


def memuat(mode):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>memeriksa semua bed</span></div>
    {row_ws("1", "301-C", "<b>Tn. A.M.</b> · 72 · Gagal jantung", "RR 22 /mnt<small>> 20 selama 2 mnt · belum dicek</small>", '<span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span>')}
    <div class="calm glass" style="padding:26px 30px">
      <div class="h">{spinner("var(--lo)", 30)}<h2 style="font-size:26px">Menunggu data pertama dari 3 hub</h2></div>
      <div class="chips"><span>301-B</span><span>302-A</span><span>302-D</span></div>
      <p style="font-size:16px">Bed yang belum mengirim data dalam 10 dtk masuk antrean sebagai <b>Tidak terpantau</b>, lengkap dengan penyebabnya.</p>
    </div>
    <div class="skel"></div><div class="skel"></div>
  </section>"""
    right = panel("5/8", tally(B8_MUAT) + rooms_lega(B8_MUAT))
    hub = f'{spinner("var(--lo)", 14)}<b>Menghubungkan</b> · 5/8 hub'
    body = f'{topbar(hub=hub, terp="5/8", clock="07.01")}<div class="wrap" style="grid-template-columns:1fr 620px">{q}{right}</div>'
    return doc(f"R3 · Memuat · {mode}", css(), body, mode)


def s1366(mode):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>4 item</span></div>
    {pra_card()}{row_kr()}{row_ws("3")}{row_tk("4")}
  </section>"""
    rooms = ""
    for i, name in enumerate(("301", "302")):
        bs = B8[i * 4:(i + 1) * 4]
        n = sum(1 for b in bs if b[1] != "empty")
        rooms += f'<div class="room2"><div class="rl"><b>KAMAR {name}</b><span>{n} pasien</span></div><div class="g2">' + "".join(tile(b, dense=True) for b in bs) + "</div></div>"
    right = f"""<section class="panel glass" style="gap:10px">
    <div class="rhd"><h2>Denah Lantai 3</h2><div class="cnt"><b>7/8</b>bed terpantau</div></div>
    {tally(B8)}{rooms}
    <div class="hint" style="margin-top:auto">Klik bed untuk detail</div>
  </section>"""
    body = f'{topbar()}<div class="wrap">{q}{right}</div>'
    return doc(f"R3 · 1366×768 · {mode}", css(S1366_CSS), body, mode)


FRAMES = [
    ("utama-light", lambda: utama("light")), ("utama-dark", lambda: utama("dark")),
    ("bed24-light", lambda: bed24("light")), ("bed24-dark", lambda: bed24("dark")),
    ("kosong-light", lambda: kosong("light")), ("gangguan-dark", lambda: gangguan("dark")),
    ("memuat-light", lambda: memuat("light")), ("ringan-light", lambda: utama("light", ringan=True)),
    ("s1366-dark", lambda: s1366("dark")),
]

if __name__ == "__main__":
    for name, fn in FRAMES:
        p = HERE / f"{name}.html"
        p.write_text(fn(), encoding="utf-8")
        print("wrote", p.name)
