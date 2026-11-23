"""Ronde 5 · Roll out (bagian 2).

  S5  Lembar tindak lanjut (pendukung, 1 versi): terang = sedang menulis, gelap = gagal tersimpan
  S6  Mode demo (kunci, 3 variasi): A Panel demo · B Pita alur · C Panggung alur
  S7  Ponsel perawat (kunci, 3 variasi): A Antrean penuh · B Tab + dok alarm · C Ambil alih layar
  S8  Ponsel Tim Code Blue (kunci, 3 variasi): A Panggilan penuh · B Geser untuk tiba · C Daftar panggilan

Token baru (perlu masuk design system bila disetujui): --demo, --demoText, --demoSoft, --demoEdge
(ungu pekat, hanya untuk menandai data fiktif; tidak dipakai untuk status klinis).
Output: s5-*.html, s6{a,b,c}-*.html, ponsel.html (18 layar ponsel, kelas .phone, diimpor per elemen).
"""
import importlib.util
import math
import pathlib

HERE = pathlib.Path(__file__).parent


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


R3 = _load("r3", HERE.parent / "round-3" / "build.py")
R5 = _load("r5", HERE.parent / "round-5" / "build.py")

DEMO_TOK = {
    "light": "--demo:#6232D5;--demoText:#5426C8;--demoSoft:rgba(98,50,213,.10);--demoEdge:rgba(98,50,213,.45);",
    "dark": "--demo:#7C4DFF;--demoText:#C4B2FF;--demoSoft:rgba(124,77,255,.16);--demoEdge:rgba(160,130,255,.55);",
}
for _m in ("light", "dark"):
    R3.TOKENS[_m] += DEMO_TOK[_m]

oct_, tri, circ, off, okdot, siren = R3.oct_, R3.tri, R3.circ, R3.off, R3.okdot, R3.siren
spinner, ticks, PHONE, COIL, SOUND = R3.spinner, R3.ticks, R3.PHONE, R3.COIL, R3.SOUND

PAUSE = '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="2" width="3.6" height="12" rx="1.2" style="fill:currentColor"/><rect x="9.4" y="2" width="3.6" height="12" rx="1.2" style="fill:currentColor"/></svg>'
INFO = '<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none"><circle cx="8" cy="8" r="7" style="fill:none;stroke:currentColor" stroke-width="1.6"/><rect x="7.2" y="7" width="1.6" height="5" rx=".8" style="fill:currentColor"/><circle cx="8" cy="4.7" r="1" style="fill:currentColor"/></svg>'
LOCK = '<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none;margin-top:1px"><rect x="3" y="7" width="10" height="7.5" rx="2" style="fill:none;stroke:currentColor" stroke-width="1.6"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" style="fill:none;stroke:currentColor" stroke-width="1.6"/></svg>'
IC_HUB = '<svg width="18" height="18" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2.5" style="fill:none;stroke:currentColor" stroke-width="2"/><path d="M8 1v3M12 1v3M8 16v3M12 16v3M1 8h3M1 12h3M16 8h3M16 12h3" style="stroke:currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
IC_PAD = '<svg width="18" height="18" viewBox="0 0 30 30" fill="none"><rect x="1.5" y="1.5" width="27" height="27" rx="8" style="stroke:currentColor" stroke-width="2.6"/><rect x="7.5" y="7.5" width="15" height="15" rx="4.5" style="stroke:currentColor" stroke-width="2.6"/><rect x="12" y="12" width="6" height="6" rx="2" style="fill:currentColor"/></svg>'
IC_RULE = '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M4 5h12M4 10h8M4 15h10" style="stroke:currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
IC_OUT = '<svg width="18" height="18" viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z" style="fill:currentColor"/><path d="M11 5.5c1 .8 1 4.2 0 5M13 3.5c2 1.8 2 7.2 0 9" style="fill:none;stroke:currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
ARW = '<div class="arw"><svg width="26" height="20" viewBox="0 0 26 20"><path d="M2 10h19M15 4l6 6-6 6" style="fill:none;stroke:currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
ARWD = '<div class="arwd"><svg width="20" height="16" viewBox="0 0 20 16"><path d="M10 1v12M4 8l6 6 6-6" style="fill:none;stroke:currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
CHECK = '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" style="fill:none;stroke:currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# ------------------------------------------------------------------ CSS bersama
BASE5B = """
.k{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.seg{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:var(--hair)}
.seg span{height:30px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;font-size:13px;font-weight:600;color:var(--tx2)}
.seg span.on{background:var(--solid);color:var(--tx);box-shadow:0 1px 4px rgba(0,0,0,.08)}
.dtag{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:8px;background:var(--demo);color:#fff;font-size:12px;font-weight:800;letter-spacing:.08em;white-space:nowrap}
.pdemo{background:var(--demo)!important;color:#fff!important;border-color:transparent!important}.pdemo b{color:#fff!important}
.demoframe{position:absolute;left:0;top:0;right:0;bottom:0;box-shadow:inset 0 0 0 6px var(--demo);pointer-events:none}
.demotab{position:absolute;left:50%;top:0;transform:translateX(-50%);height:28px;padding:0 18px;border-radius:0 0 12px 12px;background:var(--demo);color:#fff;font-size:12px;font-weight:800;letter-spacing:.16em;display:flex;align-items:center;white-space:nowrap}
.calmline{border-radius:20px;padding:14px 18px;font-size:15px;color:var(--tx2);display:flex;align-items:center;gap:10px}
.calmline b{color:var(--tx)}
.callq{position:relative}
.cnum{position:absolute;top:-14px;left:-14px;width:32px;height:32px;border-radius:50%;background:var(--demo);color:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px var(--bg);z-index:2}
.callt{box-shadow:inset 0 0 0 4px var(--hi),0 0 0 4px var(--bg),0 0 0 7px var(--demo)!important}
/* alur pad -> hub -> aturan -> keluaran */
.node{border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.node.on{box-shadow:inset 0 0 0 2px var(--demo),var(--shadow)}
.node.hit{box-shadow:inset 0 0 0 3px var(--hi),var(--shadow)}
.node .nt{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--demoText)}
.node.hit .nt{color:var(--hiText)}
.node .nt small{margin-left:auto;font-weight:600;letter-spacing:0;text-transform:none;color:var(--tx3);font-size:12px}
.arw{display:flex;align-items:center;justify-content:center;color:var(--demoText)}
.arwd{display:flex;justify-content:center;color:var(--demoText);height:18px}
.pv{font-size:14px;color:var(--tx2);line-height:1.35}
.hv{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.hv .big{font-size:30px;font-weight:700;letter-spacing:-.02em;font-feature-settings:'tnum' 1}
.hv span:last-child{font-size:14px;color:var(--tx2)}
.hk{display:flex;gap:14px;font-size:13px;color:var(--tx3);flex-wrap:wrap}.hk b{color:var(--tx);font-weight:600;margin-left:4px}
.rules2{display:flex;flex-direction:column;gap:8px}
.rul{border-radius:12px;padding:8px 10px;font-size:14px;line-height:1.35;display:flex;gap:8px;align-items:flex-start}
.rul.hit{background:var(--hiSoft);box-shadow:inset 0 0 0 2px var(--hi)}.rul.hit b{color:var(--hiText)}
.rul.wait{background:var(--hair);color:var(--tx2)}.rul.wait b{color:var(--tx)}
.rul svg{flex:none;margin-top:2px}
.ri .acts{align-items:center}
.outs{display:flex;flex-direction:column;gap:6px}
.out{display:grid;grid-template-columns:12px auto 1fr;gap:8px;align-items:center;font-size:14px}
.out i{width:10px;height:10px;border-radius:50%;background:var(--hair);box-shadow:inset 0 0 0 1.5px var(--tx3)}
.out.on i{background:var(--hi);box-shadow:0 0 0 4px var(--hiSoft)}
.out b{font-weight:600;white-space:nowrap}.out span{color:var(--tx3);font-size:13px;text-align:right;white-space:nowrap}
.out.off b{color:var(--tx3);font-weight:500}
.pipe.h{display:grid;grid-template-columns:1fr 30px 1fr 30px 1.15fr 30px 1.1fr;align-items:stretch}
.pipe.v{display:flex;flex-direction:column}
.pipe.v .node{display:grid;grid-template-columns:118px 1fr;gap:6px 14px;align-items:center;padding:12px 14px}
.pipe.v .node .nt{flex-direction:column;align-items:flex-start;gap:4px}
.pipe.v .node .nt small{margin-left:0}
/* langkah */
.steps{display:flex;flex-direction:column;gap:2px}
.stp{display:grid;grid-template-columns:30px 1fr auto;gap:12px;align-items:center;padding:7px 12px;border-radius:14px}
.stp .m,.hs .m{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:inset 0 0 0 2px var(--hair);color:var(--tx3);flex:none}
.stp.done .m,.hs.done .m{background:var(--ok);box-shadow:none;color:#fff}
.stp.cur{background:var(--demoSoft);box-shadow:inset 0 0 0 2px var(--demo)}
.stp.cur .m,.hs.cur .m{background:var(--demo);box-shadow:none;color:#fff}
.stp .tt b{display:block;font-size:16px;font-weight:600}.stp .tt small{font-size:13px;color:var(--tx3)}
.stp.next .tt b{color:var(--tx2);font-weight:500}
.stp .tm{font-size:13px;color:var(--tx3);font-feature-settings:'tnum' 1}
.hsteps{display:grid;grid-template-columns:repeat(5,1fr)}
.hs{position:relative;display:flex;flex-direction:column;gap:6px;padding-right:10px}
.hs:before{content:"";position:absolute;top:13px;left:34px;right:4px;height:2px;background:var(--hair)}
.hs.done:before{background:var(--ok)}
.hs:last-child:before{display:none}
.hs b{font-size:14px;font-weight:600;line-height:1.2}.hs small{font-size:12px;color:var(--tx3);font-feature-settings:'tnum' 1}
.hs.next b{color:var(--tx2);font-weight:500}
.narr .k2{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--demoText)}
.narr h3{font-size:26px;font-weight:700;letter-spacing:-.02em;margin:4px 0 6px}
.narr p{font-size:17px;line-height:1.5;color:var(--tx2)}.narr p b{color:var(--tx)}
.ctrl{display:flex;gap:10px;align-items:center}
.ctrl .btn{height:52px;font-size:16px}
.ctrl .el{margin-left:auto;font-size:15px;color:var(--tx2);font-feature-settings:'tnum' 1;white-space:nowrap}.ctrl .el b{color:var(--tx);font-size:22px}
.scsel{height:52px;border-radius:16px;display:flex;align-items:center;gap:10px;padding:0 16px;font-size:16px}
.scsel b{font-weight:700}.scsel small{color:var(--tx3);font-weight:600;font-size:14px}
.sclist{display:flex;flex-wrap:wrap;gap:8px}
.sclist span{height:36px;padding:0 12px;border-radius:12px;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;border:1px solid var(--hair);background:var(--glass2);color:var(--tx2)}
.sclist span.on{background:var(--demo);color:#fff;border-color:transparent}
.sclist span.all{border:1.5px dashed var(--demoEdge);color:var(--demoText);background:transparent}
.claim{font-size:12px;color:var(--tx3)}
"""

STEPS = [("00.00", "Napas normal", "RR 16 /mnt, napas efektif teratur"),
         ("00.08", "Napas berhenti", "hub mulai menghitung detik"),
         ("00.28", "Pra-alarm", "≥ 20 dtk tanpa napas efektif"),
         ("00.43", "Code Blue otomatis", "15 dtk tanpa verifikasi perawat"),
         ("00.55", "Tim tiba", "waktu respons tercatat")]
CUR = 2
SCEN = ["Perburukan", "Henti napas", "Henti napas + gasping", "Tombol manual", "Pad terlepas", "Pasien turun"]
NARR = ("Sudah <b>22 dtk tanpa napas efektif</b>, melewati batas 20 dtk. Hub menyalakan Pra-alarm: nurse station dan ponsel perawat "
        "berbunyi berulang, bedhead meminta verifikasi. Perawat punya <b>15 dtk</b> untuk mengecek pasien sebelum Code Blue otomatis.")
OUTS = [("Nurse station", "bunyi berulang", True), ("Ponsel perawat", "berbunyi", True), ("Bedhead", "minta verifikasi", True),
        ("Relay lampu NS", "saat Code Blue", False), ("Ponsel Tim CB", "saat Code Blue", False)]
B8D = [("301-A", "ok", "", "RR 16"), ("301-B", "pra", "1", "CB 13 dtk"), ("301-C", "ok", "", "RR 18"), ("301-D", "empty", "", "siap pakai"),
       ("302-A", "ok", "", "RR 13"), ("302-B", "ok", "", "RR 17"), ("302-C", "ok", "", "RR 19"), ("302-D", "ok", "", "RR 15")]


def padwave(w, h, secs=30, stop=8):
    n = 300
    pts = []
    for i in range(n + 1):
        t = i / n * secs
        if t < stop:
            y = h * 0.55 - math.sin(2 * math.pi * t / 3.75) * h * 0.32
        else:
            y = h * 0.55 + math.sin(t * 7.3) * 1.1
        pts.append(f"{i / n * w:.1f},{y:.1f}")
    x0 = stop / secs * w
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="display:block;overflow:visible">'
            f'<polyline points="{" ".join(pts)}" style="fill:none;stroke:var(--tx)" stroke-width="2.2" stroke-linejoin="round"/>'
            f'<path d="M{x0 + 2:.1f} 6v-4h{w - x0 - 4:.1f}v4" style="fill:none;stroke:var(--hi)" stroke-width="1.6"/>'
            f'<text x="{(x0 + w) / 2:.1f}" y="{h - 2}" text-anchor="middle" style="fill:var(--hiText);font-size:12px;font-weight:700">datar 22 dtk</text></svg>')


def node(title, sub, icon, body, state):
    return f'<div class="node {state} glass2"><div class="nt">{icon}{title}<small>{sub}</small></div><div>{body}</div></div>'


def outs():
    return '<div class="outs">' + "".join(
        f'<div class="out {"on" if on else "off"}"><i></i><b>{a}</b><span>{b}</span></div>' for a, b, on in OUTS) + "</div>"


def rules():
    return (f'<div class="rules2"><div class="rul hit">{CHECK}<span>≥ 20 dtk tanpa napas efektif → <b>Pra-alarm</b></span></div>'
            f'<div class="rul wait">{spinner("var(--tx2)", 14)}<span>15 dtk tanpa verifikasi → Code Blue otomatis · <b>13 dtk lagi</b></span></div></div>')


def hub_body():
    return ('<div class="hv"><span class="big">22 dtk</span><span>tanpa napas efektif</span></div>'
            '<div class="hk"><span>RR<b>— /mnt</b></span><span>SQI<b>0,91</b></span><span>Pasien<b>ada</b></span></div>')


def pipe(kind, ww, wh):
    pad = f'<div class="pv">Sinyal napas dari kumparan</div>{padwave(ww, wh)}'
    nodes = [node("Pad", "di bawah sprei", IC_PAD, pad, "on"), node("Hub", "ESP32 · bedhead", IC_HUB, hub_body(), "on"),
             node("Aturan", "diputuskan hub", IC_RULE, rules(), "hit"), node("Keluaran", "", IC_OUT, outs(), "on")]
    sep = ARW if kind == "h" else ARWD
    return f'<div class="pipe {kind}">' + sep.join(nodes) + "</div>"


def stepper_v():
    rows = []
    for i, (t, ti, de) in enumerate(STEPS):
        st = "done" if i < CUR else ("cur" if i == CUR else "next")
        mark = CHECK if st == "done" else str(i + 1)
        rows.append(f'<div class="stp {st}"><span class="m">{mark}</span><span class="tt"><b>{ti}</b><small>{de}</small></span><span class="tm">{t}</span></div>')
    return '<div class="steps">' + "".join(rows) + "</div>"


def stepper_h():
    rows = []
    for i, (t, ti, _) in enumerate(STEPS):
        st = "done" if i < CUR else ("cur" if i == CUR else "next")
        mark = CHECK if st == "done" else str(i + 1)
        rows.append(f'<div class="hs {st}"><span class="m">{mark}</span><b>{ti}</b><small>{t}</small></div>')
    return '<div class="hsteps">' + "".join(rows) + "</div>"


def narr(size=""):
    return f'<div class="narr"><div class="k2">Langkah 3 dari 5</div><h3 {size}>Pra-alarm menyala</h3><p>{NARR}</p></div>'


def ctrl():
    return (f'<div class="ctrl"><span class="btn ink">{PAUSE}Jeda</span><span class="btn ghost">Ulangi</span>'
            f'<span class="btn ghost">Akhiri demo</span><span class="el"><b>00.30</b> / 00.55</span></div>')


def sclist():
    items = "".join(f'<span class="{"on" if i == 1 else ""}">{i + 1} · {s}</span>' for i, s in enumerate(SCEN))
    return f'<div class="sclist">{items}<span class="all">▶ Jalankan semua · ± 3 mnt</span></div>'


def topbar_demo():
    t = R3.topbar(hub="DEMO · Simulasi", terp="8/8", clock="10.53")
    t = t.replace('<span class="pill glass2">DEMO · Simulasi</span>', '<span class="pill pdemo"><b>DEMO</b> · Simulasi</span>')
    return t.replace("<b>Ns. Rina</b> · jaga", "<b>Tim SiagaBed</b> · demo")


DEMO_OVERLAY = '<div class="demoframe"></div><div class="demotab">DEMO · DATA FIKTIF</div>'


def pra_demo():
    return R3.pra_card("13 dtk", 13).replace("26 dtk", "22 dtk")


CALM = f'<div class="calmline glass">{okdot()}<span><b>Bed lain tenang</b> · 7 pasien terpantau, 1 bed kosong · tidak ada item lain</span></div>'


def denah_rapat(title_cnt="8/8"):
    return (f'<section class="panel glass" style="gap:12px"><div class="rhd" style="padding:0 4px"><h2>Denah Lantai 3</h2>'
            f'<div class="cnt"><b>{title_cnt}</b>bed terpantau</div></div>{R3.rooms_rapat(B8D)}</section>')


# ------------------------------------------------------------------ S6 · A Panel demo
S6A = """
.wrap{grid-template-columns:1fr 760px!important}
.dpanel{gap:12px;padding:20px 22px;box-shadow:inset 0 0 0 2px var(--demoEdge),var(--shadow)}
.dhead{display:flex;align-items:center;gap:10px}
.dhead .scsel{height:40px;padding:0 12px;border-radius:12px;font-size:15px}
.dpanel .stp{padding:6px 12px}.dpanel .stp .tt small{display:none}
.dpanel .narr h3{font-size:24px;margin:2px 0 4px}.dpanel .narr p{font-size:16px;line-height:1.45}
.dpanel .rules2{flex-direction:row}.dpanel .rules2 .rul{flex:1}
.dpanel .outs{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}
.dpanel .pipe.v .node{padding:10px 14px}
"""


def s6a(mode):
    left = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>1 item · data demo</span></div>
    {pra_demo()}{CALM}{denah_rapat()}
  </section>"""
    panel = f"""<section class="panel glass dpanel">
    <div class="dhead"><span class="dtag">DEMO · data fiktif</span><span class="scsel glass2"><small>Skenario 2/6</small><b>Henti napas</b><small>▾</small></span><span class="sp"></span>
      <span class="seg"><span class="on">Simulasi</span><span>Hub palsu</span></span></div>
    {stepper_v()}
    {narr()}
    {pipe("v", 520, 40)}
    {ctrl()}
  </section>"""
    body = f'{topbar_demo()}<div class="wrap">{left}{panel}</div>{DEMO_OVERLAY}'
    return R3.doc(f"S6 · A · Panel demo · {mode}", R3.css(BASE5B, S6A), body, mode)


# ------------------------------------------------------------------ S6 · B Pita alur
S6B = """
.wrap{bottom:316px!important;grid-template-columns:1fr 640px!important}
.ribbon{position:absolute;left:24px;right:24px;bottom:24px;height:272px;border-radius:28px;padding:18px 20px;display:grid;grid-template-columns:270px 470px 1fr;gap:22px;
  box-shadow:inset 0 0 0 2px var(--demoEdge),var(--shadow)}
.ribbon .c1{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.ribbon .scn{font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1.15}
.ribbon .scn small{display:block;font-size:12px;font-weight:700;color:var(--tx3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.ribbon .ctrl .btn{height:44px;font-size:15px}
.ribbon .c1f{display:flex;align-items:center;gap:10px;width:100%;margin-top:auto}
.ribbon .c1f .el{font-size:14px;color:var(--tx2);font-feature-settings:'tnum' 1}.ribbon .c1f .el b{font-size:20px;color:var(--tx)}
.lnk{font-size:14px;font-weight:600;text-decoration:underline;text-underline-offset:3px;color:var(--tx2)}
.ribbon .c2{display:flex;flex-direction:column;gap:12px;min-width:0}
.ribbon .narr h3{font-size:20px;margin:2px 0 4px}.ribbon .narr p{font-size:14px;line-height:1.45}
.ribbon .node{padding:12px 14px}
.ribbon .hv .big{font-size:26px}
.ribbon .rul{font-size:13px}
.ribbon .out{font-size:13px}.ribbon .out span{font-size:12px}
.panel .room{padding:10px}
.panel .cb{height:136px}
"""


def s6b(mode):
    q = pra_demo().replace('<div class="qi pra">', '<div class="qi pra callq"><span class="cnum">3</span>', 1)
    den = (R3.tally(B8D) + R3.rooms_lega(B8D)).replace('<div class="cb s-pra glass2">', '<div class="cb s-pra glass2 callt"><span class="cnum">3</span>', 1)
    left = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>1 item · data demo</span></div>
    {q}{CALM}
  </section>"""
    right = f"""<section class="panel glass" style="gap:12px"><div class="rhd" style="padding:0 4px"><h2>Denah Lantai 3</h2><div class="cnt"><b>8/8</b>bed terpantau</div></div>{den}</section>"""
    ribbon = f"""<section class="ribbon glass">
    <div class="c1">
      <span class="dtag">DEMO · data fiktif</span>
      <div class="scn"><small>Skenario 2 dari 6</small>Henti napas</div>
      <span class="seg"><span class="on">Simulasi</span><span>Hub palsu</span></span>
      <div class="ctrl"><span class="btn ink">{PAUSE}Jeda</span><span class="btn ghost">Ulangi</span></div>
      <div class="c1f"><span class="el"><b>00.30</b> / 00.55</span><span class="sp"></span><span class="lnk">Akhiri demo</span></div>
    </div>
    <div class="c2">{stepper_h()}{narr()}</div>
    {pipe("h", 196, 54)}
  </section>"""
    body = f'{topbar_demo()}<div class="wrap">{left}{right}</div>{ribbon}{DEMO_OVERLAY}'
    return R3.doc(f"S6 · B · Pita alur · {mode}", R3.css(BASE5B, S6B), body, mode)


# ------------------------------------------------------------------ S6 · C Panggung alur
S6C = """
.stage{position:absolute;left:24px;right:24px;top:112px;height:300px;border-radius:30px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;
  box-shadow:inset 0 0 0 2px var(--demoEdge),var(--shadow)}
.stage .head{display:flex;align-items:center;gap:12px}
.stage .head h2{font-size:22px;font-weight:600}
.stage .pipe{flex:1}
.stage .node{padding:14px 18px}
.stage .hv .big{font-size:44px}
.stage .rul{font-size:15px}
.wrap{top:432px!important;grid-template-columns:600px 1fr!important}
.story{border-radius:30px;padding:18px 22px;display:flex;flex-direction:column;gap:12px}
.story .sclist span{height:32px;font-size:13px}
.story .narr h3{font-size:22px;margin:2px 0 4px}.story .narr p{font-size:15px;line-height:1.45}
.story .stp{padding:5px 12px}.story .stp .tt small{display:none}
.story .ctrl .btn{height:46px;font-size:15px}
.prod .dense .ri{grid-template-columns:170px 110px 220px 1fr auto}
"""


def s6c(mode):
    prar = f"""<div class="dense"><div class="ri prar">
      <span class="lv"><span class="ordb" style="background:var(--hi);color:#fff">1</span>{oct_()}Pra-alarm</span>
      <span class="bid">301-B</span><span class="pt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span>
      <span class="why"><span><b>22 dtk</b> tanpa napas efektif<small>Code Blue otomatis 13 dtk</small></span></span>
      <span class="acts"><span class="btn call">{PHONE}Panggil Code Blue</span><span class="btn hold">Batalkan</span></span>
    </div></div>"""
    stage = f"""<section class="stage glass">
    <div class="head"><span class="dtag">DEMO · data fiktif</span><h2>Dari sensor sampai alarm</h2><span class="k" style="margin-left:6px">menyala sesuai langkah</span><span class="sp"></span><span class="claim">Bukan alat diagnosis · belum diuji pada manusia</span></div>
    {pipe("h", 400, 74)}
  </section>"""
    story = f"""<section class="story glass">
    <div style="display:flex;align-items:center;gap:10px"><span class="k">Skenario</span><span class="sp"></span><span class="seg"><span class="on">Simulasi</span><span>Hub palsu</span></span></div>
    {sclist()}
    {stepper_v()}
    {narr()}
    {ctrl()}
  </section>"""
    prod = f"""<section class="panel glass prod" style="gap:12px">
    <div class="rhd" style="padding:0 4px"><h2>Layar perawat</h2><div class="cnt">sama persis dengan mode kerja · <b>8/8</b>terpantau</div></div>
    {prar}{CALM}{R3.tally(B8D)}{R3.rooms_rapat(B8D)}
  </section>"""
    body = f'{topbar_demo()}{stage}<div class="wrap">{story}{prod}</div>{DEMO_OVERLAY}'
    return R3.doc(f"S6 · C · Panggung alur · {mode}", R3.css(BASE5B, S6C), body, mode)


# ------------------------------------------------------------------ S5 · Lembar tindak lanjut
S5_CSS = """
.wrap{grid-template-columns:1fr 760px!important}
.ri.fu{box-shadow:inset 0 0 0 2px var(--ink),var(--shadow)}.ri.fu .lv{color:var(--tx)}
.ri.selr{box-shadow:inset 0 0 0 2px var(--ink),0 0 0 4px var(--bg),0 0 0 7px var(--sel),var(--shadow)!important}
.fsheet{border-radius:32px;padding:24px 26px;display:flex;flex-direction:column;gap:16px;min-width:0}
.fh{display:flex;align-items:center;gap:14px}
.fh .t{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1}
.ctx{display:grid;grid-template-columns:96px 1fr;gap:8px 14px;font-size:15px;padding:16px 18px;border-radius:18px;line-height:1.35}
.ctx span{color:var(--tx3)}.ctx b{font-weight:600}
.chips2{display:flex;flex-wrap:wrap;gap:8px}
.chip{height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;border:1px solid var(--hair);background:var(--glass2);color:var(--tx)}
.chip.on{background:var(--ink);color:var(--onInk);border-color:transparent}
.ta{border-radius:18px;padding:14px 16px;min-height:132px;font-size:16px;line-height:1.5;border:1.5px solid var(--hair);background:var(--solid);color:var(--tx)}
.ta.focusd{box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--focus)}
.caret{display:inline-block;width:2px;height:20px;background:var(--focus);vertical-align:-4px;margin-left:1px}
.cnt2{display:flex;justify-content:flex-end;font-size:12px;color:var(--tx3);margin-top:-8px}
.meta2{display:flex;justify-content:space-between;align-items:center;font-size:15px;color:var(--tx2)}.meta2 b{color:var(--tx)}
.meta2 u{color:var(--tx);text-decoration:underline;text-underline-offset:3px}
.lock{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--tx3);line-height:1.4}
.facts{display:flex;gap:10px;margin-top:auto}
.facts .btn{height:56px;font-size:17px}
.fail{margin-top:0}
"""

CHIPS = [("Pasien sadar, napas spontan", True), ("Ventilasi bag-mask", True), ("Diberi oksigen", False), ("RJP dilakukan", False),
         ("DPJP dihubungi", True), ("Dipindah ke ICU", False), ("Keluarga diberi tahu", False), ("Artefak gerak", False),
         ("Alarm tanpa kejadian klinis", False)]
FTEXT = "Ventilasi bag-mask ± 1 mnt oleh tim, napas spontan kembali 10.54. DPJP dihubungi 10.57, persiapan pindah ke ICU."


def s5(mode, failed=False):
    kr = R3.row_kr("1").replace(
        '<span class="acts"><span class="btn onred">Sudah dicek</span><span class="btn onred2">Lihat tren</span></span>',
        '<span class="acts"><span class="sendnote" style="font-size:14px">✓ Dicek 10.54</span><span class="btn onred2">Lihat tren</span></span>')
    ws304 = R3.row_ws("2", "304-B", "<b>Tn. K.R.</b> · 77 · Pasca-ORIF femur", "RR 9 /mnt ↓<small>≤ 10 selama 2 mnt 30 dtk</small>",
                      '<span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span>')
    fu305 = R5.ri("fu selr", "5", "background:var(--ink);color:var(--onInk)", "", "Tindak lanjut", "305-B",
                  "<b>Tn. H.S.</b> · 70 · Sepsis, pneumonia", "Code Blue selesai 10.56<small>Respons 1 mnt 12 dtk</small>",
                  '<span class="btn ink">Tulis tindak lanjut</span>')
    fu301 = R5.ri("fu", "6", "background:var(--ink);color:var(--onInk)", "", "Tindak lanjut", "301-B",
                  "<b>Ny. R.W.</b> · 54 · Pascalaparotomi H+1", "Pra-alarm dibatalkan di bedhead 10.53<small>Pasien sudah dicek · diterima hub</small>",
                  '<span class="btn ghost">Tulis tindak lanjut</span>')
    left = f"""<section class="left dense">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>6 item · urut paling genting</span></div>
    {kr}{ws304}{R3.row_ws("3")}{R3.row_tk("4")}{fu305}{fu301}
  </section>"""
    chips = "".join(f'<span class="chip{" on" if on else ""}">{CHECK + " " if on else ""}{t}</span>' for t, on in CHIPS)
    if failed:
        acts = (f'<div class="fail">{R3.warn_ic(s=22)}<div class="t"><b>Belum tersimpan</b>Server log tidak tersambung. Teks tetap di sini; coba simpan lagi.</div></div>'
                '<div class="facts"><span class="btn ink">Coba simpan lagi</span><span class="btn ghost">Batal</span></div>')
        ta = f'<div class="ta">{FTEXT}</div>'
    else:
        acts = '<div class="facts"><span class="btn ink">Simpan tindak lanjut</span><span class="btn ghost">Batal</span></div>'
        ta = f'<div class="ta focusd">{FTEXT}<span class="caret"></span></div>'
    sheet = f"""<section class="fsheet glass">
    <div class="fh"><div><div class="k">Tindak lanjut</div><div class="t">305-B · Code Blue</div></div><span class="sp"></span><span class="x" style="width:44px;height:44px">×</span></div>
    <div class="ctx glass2"><span>Kejadian</span><b>Code Blue · tombol manual di kamar</b><span>Pasien</span><b>Tn. H.S. · 70 · Sepsis, pneumonia</b>
      <span>Waktu</span><b>Mulai 10.51.48 · tim tiba 10.53.00 · selesai 10.56</b><span>Respons</span><b>1 mnt 12 dtk</b>
      <span>Ditutup</span><b>Dari ponsel Tim Code Blue · dr. Yoga</b></div>
    <div><div class="k" style="margin-bottom:10px">Frasa cepat</div><div class="chips2">{chips}</div></div>
    <div><div class="k" style="margin-bottom:10px">Catatan</div>{ta}</div>
    <div class="cnt2">{len(FTEXT)}/1000</div>
    <div class="meta2"><span>Ditulis oleh <b>Ns. Rina</b> · <u>ganti</u></span><span>Waktu <b>10.58</b> · otomatis</span></div>
    <div class="lock">{LOCK}<span>Setelah disimpan, catatan tidak bisa diubah atau dihapus. Koreksi ditulis sebagai catatan baru dan muncul di timeline bed serta log.</span></div>
    {acts}
  </section>"""
    hub = '<span class="dot"></span><b>Live</b> · 24 hub'
    body = f'{R3.topbar(hub=hub, terp="23/24", clock="10.58")}<div class="wrap">{left}{sheet}</div>'
    name = "gagal tersimpan" if failed else "menulis"
    return R3.doc(f"S5 · Tindak lanjut · {name} · {mode}", R3.css(BASE5B, S5_CSS), body, mode)


# ------------------------------------------------------------------ Ponsel (S7, S8)
PH_CSS = """
body{width:2900px!important;height:auto!important;overflow:visible!important}
.board{display:flex;flex-wrap:wrap;gap:48px;padding:48px}
.phone{position:relative;width:390px;height:844px;overflow:hidden;flex:none;color:var(--tx);
  background:radial-gradient(360px 260px at 0% 0%,var(--glowA),transparent 70%),radial-gradient(320px 260px at 100% 12%,var(--glowB),transparent 70%),linear-gradient(180deg,var(--bgTop) 0%,var(--bg) 42%)}
.phone .ordb{width:22px;height:22px;font-size:12px}
.sbar{height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px;font-size:15px;font-weight:600;font-feature-settings:'tnum' 1}
.sbar .ic{display:flex;gap:6px;align-items:center}
.abar{display:flex;align-items:center;gap:6px;padding:4px 14px 8px}
.abar .w{font-size:17px;font-weight:700;line-height:1.15;white-space:nowrap}.abar .w small{display:block;font-size:12px;font-weight:500;color:var(--tx3)}
.mp{height:34px;padding:0 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;white-space:nowrap}
.mp.ic1{width:34px;padding:0;justify-content:center}
.o1{margin:0 16px 2px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--tx3);line-height:1.3}
.mh2{display:flex;align-items:baseline;gap:8px;padding:12px 18px 8px}.mh2 h2{font-size:19px;font-weight:600}.mh2 span{font-size:13px;color:var(--tx3)}
.mcard{margin:0 12px 10px;border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.mpra{background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 3px var(--hi),var(--shadow)}
.mhd{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.mhd .t{margin-left:auto;font-weight:500;letter-spacing:0;text-transform:none;color:var(--tx3);font-size:12px}
.mid{display:flex;align-items:flex-end;gap:12px}
.mbed{font-size:60px;font-weight:700;letter-spacing:-.045em;line-height:.88}
.mpt{font-size:14px;color:var(--tx2);line-height:1.35;padding-bottom:2px}.mpt b{color:var(--tx)}
.mwhy{border-radius:14px;padding:10px 12px;background:var(--hiSoft);display:flex;align-items:center;gap:10px}
.mwhy .a{font-size:14px;line-height:1.3}.mwhy .a b{font-size:22px;font-weight:700}
.mwhy .c{margin-left:auto;text-align:right;font-size:12px;color:var(--tx2);line-height:1.3}.mwhy .c b{display:block;font-size:22px;color:var(--hiText)}
.mticks .ticks{display:grid;grid-template-columns:repeat(15,1fr);gap:4px}.mticks .ticks i{width:auto;height:10px;border-radius:5px}
.mbtn{height:54px;width:100%;font-size:17px}
.mbtn small{font-size:12px}
.mrow{margin:0 12px 8px;border-radius:18px;padding:8px 12px 12px 14px;display:flex;flex-direction:column;gap:2px}
.mrow .r1{display:flex;align-items:center;gap:6px;min-height:44px}
.mrow .lv{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.mrow .r2{display:flex;align-items:center;gap:12px}
.mrow .b{font-size:30px;font-weight:700;letter-spacing:-.03em;line-height:1;white-space:nowrap}
.mrow .w{font-size:14px;line-height:1.3}.mrow .w small{display:block;font-size:12px;color:var(--tx3)}
.mrow .btn{height:44px;font-size:14px;padding:0 16px}
.mrow.kr{background:var(--hi);color:#fff;box-shadow:0 10px 24px rgba(215,38,43,.28)}
.mrow.kr .w small{color:rgba(255,255,255,.85)}.mrow.kr .ordb{background:#fff;color:#C01F24}
.mrow.ws .lv{color:var(--md)}.mrow.ws .ordb{background:var(--mdDot);color:#1B1200}
.mrow.tk .lv{color:var(--lo)}.mrow.tk .ordb{background:var(--lo);color:#fff}
.mroom{margin:0 12px 10px;border-radius:20px;padding:10px}
.mroom .rl{display:flex;justify-content:space-between;padding:0 4px 8px;font-size:12px;color:var(--tx3)}.mroom .rl b{letter-spacing:.1em;font-weight:600}
.mroom .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.phone .cbd{height:72px}
.mchips{margin:0 12px 10px;overflow:hidden}.mchips .lgd{flex-wrap:nowrap}
.dock{margin:2px 12px 10px;border-radius:20px;padding:12px 14px;background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 3px var(--hi),var(--shadow);display:flex;flex-direction:column;gap:10px}
.dock .r1{display:flex;align-items:center;gap:10px}
.dock .b{font-size:32px;font-weight:700;letter-spacing:-.03em;line-height:1;white-space:nowrap}
.dock .s{font-size:13px;line-height:1.3;color:var(--tx2)}.dock .s b{color:var(--hiText)}
.dock .cdk{margin-left:auto;text-align:right;font-size:12px;color:var(--tx2);line-height:1.2}.dock .cdk b{display:block;font-size:22px;color:var(--hiText)}
.dock .r2{display:grid;grid-template-columns:1.35fr 1fr;gap:8px}.dock .btn{height:48px;font-size:15px;padding:0 10px}
.dock .btn.call{box-shadow:none}
.tabbar{position:absolute;left:0;right:0;bottom:0;height:84px;display:flex;justify-content:space-around;align-items:flex-start;padding-top:10px;border-top:1px solid var(--hair)}
.tab{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--tx3);min-width:72px}
.tab.on{color:var(--tx)}
.tab .bdg{position:absolute;top:-6px;left:44px;min-width:20px;height:20px;border-radius:10px;background:var(--hi);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px}
.homeind{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:var(--tx);opacity:.85}
.take{margin:2px 12px 12px;border-radius:28px;padding:18px;display:flex;flex-direction:column;gap:12px;background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 4px var(--hi),var(--shadow)}
.take .tbed{font-size:100px;font-weight:700;letter-spacing:-.05em;line-height:.85}
.tcd{display:flex;align-items:center;gap:12px}
.tcd .n{font-size:72px;font-weight:700;color:var(--hiText);line-height:.9;font-feature-settings:'tnum' 1}
.tcd .l{font-size:14px;line-height:1.3;color:var(--tx2)}.tcd .l b{color:var(--tx)}
.tcd .r{margin-left:auto;text-align:right;font-size:13px;color:var(--tx2);line-height:1.3}.tcd .r b{font-size:20px;color:var(--tx)}
.tbar{height:10px;border-radius:5px;background:var(--hair);overflow:hidden}.tbar i{display:block;height:100%;border-radius:5px;background:var(--hi)}
.nxt{margin:0 12px;border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.nl{display:flex;align-items:center;gap:10px;min-height:40px;font-size:15px;border-top:1px solid var(--hair);padding-top:6px}
.nl b{font-size:18px;font-weight:700}
.nl.kr span{color:var(--hiText);font-weight:600}.nl.ws span{color:var(--md);font-weight:600}.nl.tk span{color:var(--lo);font-weight:600}
/* S8 */
.cbfull{background:var(--cbBg)!important;color:#fff}
.cbfull:after{content:"";position:absolute;left:10px;top:10px;right:10px;bottom:10px;border-radius:30px;box-shadow:inset 0 0 0 4px #fff;pointer-events:none}
.cbin{position:absolute;left:0;right:0;top:44px;bottom:0;padding:16px 30px 34px;display:flex;flex-direction:column}
.cbh{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:800;letter-spacing:.14em}
.cbh .tt{font-size:14px;font-weight:600;letter-spacing:0;opacity:.85;font-feature-settings:'tnum' 1}
.cbw{margin-top:20px;font-size:16px;opacity:.9}
.cbbed{font-size:112px;font-weight:700;letter-spacing:-.05em;line-height:.9;margin-top:6px}
.cbroom{font-size:22px;font-weight:600;margin-top:8px}
.cbel{display:flex;align-items:baseline;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.3)}
.cbel .n{font-size:64px;font-weight:600;letter-spacing:-.03em;font-feature-settings:'tnum' 1;line-height:1}
.cbel .l{font-size:17px;opacity:.9}
.cbinfo{display:grid;grid-template-columns:76px 1fr;gap:8px 12px;margin-top:16px;font-size:16px;line-height:1.35}
.cbinfo span{opacity:.75}.cbinfo b{font-weight:600}
.cbbtn{margin-top:auto;height:76px;border-radius:999px;background:#fff;color:#7A0E13;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700}
.cbfoot{text-align:center;font-size:14px;opacity:.85;margin-top:14px}
.split .ctop{position:absolute;left:0;right:0;top:0;height:470px;background:var(--cbBg);color:#fff}
.split .ctop .in{padding:14px 28px 0}
.split .cbot{position:absolute;left:0;right:0;top:470px;bottom:0;background:var(--solid);padding:22px 24px 30px;display:flex;flex-direction:column;gap:10px}
.bigt{font-size:96px;font-weight:600;letter-spacing:-.04em;line-height:1;font-feature-settings:'tnum' 1}
.slide{margin-top:auto;position:relative;height:76px;border-radius:38px;background:var(--hiSoft);box-shadow:inset 0 0 0 2px var(--hiEdge);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--hiText)}
.slide .knob{position:absolute;left:6px;top:6px;width:64px;height:64px;border-radius:50%;background:var(--cbBg);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 6px 16px rgba(122,14,19,.35)}
.ccard{margin:0 12px 12px;border-radius:24px;padding:16px 18px;background:var(--cbBg);color:#fff;box-shadow:inset 0 0 0 3px #fff,0 0 0 1.5px var(--cbBg),0 14px 30px rgba(122,14,19,.30);display:flex;flex-direction:column;gap:8px}
.ccard .cbh{font-size:14px}
.ccard .cbh .tt{font-size:22px;font-weight:700;opacity:1}
.ccard .bb{display:flex;align-items:baseline;gap:12px}
.ccard .bb b{font-size:60px;font-weight:700;letter-spacing:-.045em;line-height:.95}
.ccard .bb span{font-size:17px;font-weight:600}
.ccard .ci{font-size:14px;line-height:1.4;opacity:.92}
.ccard .cbbtn{height:56px;font-size:18px;margin-top:6px}
.idle{display:flex;flex-direction:column;align-items:center;gap:8px;padding:36px 0 24px}
.ring{width:176px;height:176px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.ring.lo{box-shadow:inset 0 0 0 3px var(--lo);background:var(--loSoft)}
.ring.ok{box-shadow:inset 0 0 0 3px var(--ok);background:var(--okSoft)}
.it{font-size:36px;font-weight:700;letter-spacing:-.02em}
.is{font-size:17px;color:var(--tx2);text-align:center;line-height:1.35}
.ln{display:flex;align-items:center;gap:8px;font-size:15px}.ln .t{margin-left:auto;font-size:13px;color:var(--tx3)}
.ln2{font-size:14px;color:var(--tx2)}
.o1c{flex-direction:row!important;align-items:flex-start;font-size:14px;color:var(--tx2);line-height:1.4}
.mb44{height:48px;font-size:15px;width:100%}
.dark{__DARK__}
"""


def sbar(white=False, time="10.53"):
    c = "#fff" if white else "var(--tx)"
    sig = (f'<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" style="fill:{c}"/><rect x="5" y="5" width="3" height="7" rx="1" style="fill:{c}"/>'
           f'<rect x="10" y="2.5" width="3" height="9.5" rx="1" style="fill:{c}"/><rect x="15" y="0" width="3" height="12" rx="1" style="fill:{c}"/></svg>')
    wifi = f'<svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 4.2a10 10 0 0 1 14 0M3.6 6.9a6.2 6.2 0 0 1 8.8 0M6.2 9.5a2.4 2.4 0 0 1 3.6 0" style="fill:none;stroke:{c}" stroke-width="1.8" stroke-linecap="round"/></svg>'
    bat = (f'<svg width="26" height="12" viewBox="0 0 26 12"><rect x=".75" y=".75" width="21.5" height="10.5" rx="3" style="fill:none;stroke:{c}" stroke-width="1.5" opacity=".5"/>'
           f'<rect x="2.5" y="2.5" width="15" height="7" rx="1.6" style="fill:{c}"/><rect x="23.5" y="4" width="1.8" height="4" rx=".9" style="fill:{c}" opacity=".5"/></svg>')
    return f'<div class="sbar" style="color:{c}"><span>{time}</span><span class="ic">{sig}{wifi}{bat}</span></div>'


def ph(content, dark, extra=""):
    return f'<div class="phone{" dark" if dark else ""}{(" " + extra) if extra else ""}">{content}</div>'


def abar_nurse():
    return (f'<div class="abar"><div class="w">Bangsal Melati<small>Lantai 3 · Ns. Rina</small></div><span class="sp"></span>'
            f'<span class="mp glass2"><b>7/8</b>&nbsp;bed</span><span class="mp glass2"><span class="dot"></span>Live</span><span class="mp glass2 ic1">{SOUND}</span></div>')


O1 = f'<div class="o1">{INFO}<span>Ponsel hanya berbunyi saat halaman ini terbuka</span></div>'


def m_pra():
    return f"""<div class="mcard mpra">
  <div class="mhd"><span class="ordb" style="background:var(--hi);color:#fff">1</span>{oct_(s=18)}<span style="color:var(--hiText)">Pra-alarm</span><span class="t">mulai 10.53.07</span></div>
  <div class="mid"><span class="mbed">301-B</span><span class="mpt"><b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1</span></div>
  <div class="mwhy"><span class="a"><b>26 dtk</b><br>tanpa napas efektif</span><span class="c">Code Blue otomatis<b>9 dtk</b></span></div>
  <div class="mticks">{ticks(9)}</div>
  <span class="btn call mbtn">{PHONE}Panggil Code Blue sekarang</span>
  <span class="btn hold mbtn">Batalkan · sudah dicek <small>tahan 2 dtk</small></span>
</div>"""


def m_row(kind, n, glyph, level, bid, reason, pt, act):
    return (f'<div class="mrow {kind}{"" if kind == "kr" else " glass2"}"><div class="r1"><span class="ordb">{n}</span>{glyph}<span class="lv">{level}</span><span class="sp"></span>{act}</div>'
            f'<div class="r2"><span class="b">{bid}</span><span class="w">{reason}<small>{pt}</small></span></div></div>')


ROW_KR = m_row("kr", "2", tri("#fff", 16), "Kritis", "302-C", "<b>RR 31 /mnt ↑</b> · ≥ 30 selama 1 mnt 20 dtk", "Ny. D.A. · 60 · PPOK eksaserbasi", '<span class="btn onred">Sudah dicek</span>')
ROW_WS = m_row("ws", "3", circ(s=15), "Waspada", "301-C", "RR 22 /mnt · ✓ dicek 10.42", "Tn. A.M. · 72 · Gagal jantung", '<span class="btn ghost">Lihat tren</span>')
ROW_TK = m_row("tk", "4", off(s=15), "Tidak terpantau", "302-B", "Pad terlepas sejak 10.51", "Periksa konektor di bedhead", '<span class="btn ghost">Detail</span>')


def m_room(name, beds):
    n = sum(1 for b in beds if b[1] != "empty")
    tiles = "".join(R3.tile(b, dense=True) for b in beds)
    return f'<div class="mroom glass"><div class="rl"><b>KAMAR {name}</b><span>{n} pasien</span></div><div class="g2">{tiles}</div></div>'


IC_LIST = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10" style="stroke:currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
IC_GRID = '<svg width="24" height="24" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/></svg>'
IC_MORE = '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" style="fill:currentColor"/><circle cx="12" cy="12" r="2" style="fill:currentColor"/><circle cx="19" cy="12" r="2" style="fill:currentColor"/></svg>'


def tabbar(active):
    items = [("antrean", "Antrean", IC_LIST, "4"), ("bangsal", "Bangsal", IC_GRID, ""), ("lain", "Lainnya", IC_MORE, "")]
    out = []
    for key, lab, ic, bdg in items:
        b = f'<span class="bdg">{bdg}</span>' if bdg else ""
        out.append(f'<div class="tab{" on" if key == active else ""}">{ic}{lab}{b}</div>')
    return f'<div class="tabbar glass">{"".join(out)}<div class="homeind"></div></div>'


B8 = R3.B8


def s7a(dark):
    c = f"""{sbar()}{abar_nurse()}{O1}
<div class="mh2"><h2>Perlu tindakan</h2><span>4 item · paling genting di atas</span></div>
{m_pra()}{ROW_KR}{ROW_WS}{ROW_TK}
<div class="mh2"><h2>Semua bed</h2><span>7/8 terpantau</span></div>{m_room("301", B8[:4])}"""
    return ph(c, dark)


def s7b(dark):
    c = f"""{sbar()}{abar_nurse()}
<div class="dock">
  <div class="r1">{oct_(s=20)}<span class="b">301-B</span><span class="s"><b>Pra-alarm</b> · 26 dtk<br>Ny. R.W. · 1 dari 4</span><span class="cdk">Code Blue<b>9 dtk</b></span></div>
  <div class="mticks">{ticks(9)}</div>
  <div class="r2"><span class="btn call">{PHONE}Panggil Code Blue</span><span class="btn hold">Batalkan · tahan</span></div>
</div>
<div class="mchips">{R3.tally(B8)}</div>
{m_room("301", B8[:4])}{m_room("302", B8[4:])}
{tabbar("bangsal")}"""
    return ph(c, dark)


def s7c(dark):
    take = f"""<div class="take">
  <div class="mhd"><span class="ordb" style="background:var(--hi);color:#fff">1</span>{oct_(s=18)}<span style="color:var(--hiText)">Pra-alarm</span><span class="t">1 dari 4 · mulai 10.53.07</span></div>
  <div class="tbed">301-B</div>
  <div class="mpt" style="font-size:16px"><b>Ny. R.W.</b> · 54 · Pascalaparotomi H+1</div>
  <div class="tcd"><span class="n">9</span><span class="l">dtk menuju<br><b>Code Blue otomatis</b></span><span class="r"><b>26 dtk</b><br>tanpa napas efektif</span></div>
  <div class="tbar"><i style="width:60%"></i></div>
  <span class="btn call mbtn" style="height:60px">{PHONE}Panggil Code Blue sekarang</span>
  <span class="btn hold mbtn">Batalkan · sudah dicek <small>tahan 2 dtk</small></span>
</div>"""
    nxt = f"""<div class="nxt glass"><div class="k">Berikutnya di antrean</div>
  <div class="nl kr">{tri(s=16)}<b>302-C</b><span>Kritis</span>RR 31 ↑</div>
  <div class="nl ws">{circ(s=15)}<b>301-C</b><span>Waspada</span>dicek 10.42</div>
  <div class="nl tk">{off(s=15)}<b>302-B</b><span>Tidak terpantau</span>pad lepas</div>
</div>"""
    small = (f'<div class="abar"><div class="w">Melati · Lt 3</div><span class="sp"></span><span class="mp glass2"><b>7/8</b>&nbsp;bed</span>'
             f'<span class="mp glass2"><span class="dot"></span>Live</span><span class="mp glass2 ic1">{SOUND}</span></div>')
    return ph(f"{sbar()}{small}{take}{nxt}", dark)


# S8 · Tim Code Blue
def abar_team(name, status_html):
    return f'<div class="abar"><div class="w">Tim Code Blue<small>{name} · ganti</small></div><span class="sp"></span>{status_html}</div>'


CONNECTED = '<span class="mp glass2"><span class="dot"></span>Tersambung</span>'
O1_TEAM = f'<div class="mcard glass o1c">{INFO}<span>Biarkan halaman ini terbuka. Ponsel hanya berbunyi saat halaman terbuka dan layar menyala.</span></div>'


def s8_idle(dark, variant):
    if variant == "a":
        c = f"""{sbar(time="10.50")}{abar_team("dr. Yoga", CONNECTED)}
<div class="idle"><div class="ring glass2">{siren("var(--tx3)", 64)}</div><div class="it">Siaga</div><div class="is">Tidak ada panggilan</div></div>
<div class="mcard glass"><div class="ln"><span class="dot"></span><b>Tersambung · Live</b><span class="t">dicek 10.50</span></div><div class="ln2">Bangsal Melati · Lantai 3</div></div>
{O1_TEAM}<div style="margin:0 12px"><span class="btn ghost mb44">▶ Tes bunyi Code Blue</span></div>"""
    elif variant == "b":
        c = f"""{sbar(time="10.50")}{abar_team("dr. Yoga", '<span class="mp glass2" style="color:var(--lo)">' + off(s=14) + 'Terputus</span>')}
<div class="idle"><div class="ring lo">{off(s=72)}</div><div class="it" style="color:var(--lo)">Tidak tersambung</div>
<div class="is"><b style="color:var(--tx)">Panggilan Code Blue tidak akan masuk</b><br>sampai ponsel tersambung lagi</div></div>
<div class="mcard glass"><div class="ln">{spinner("var(--lo)", 16)}<b>Mencoba lagi dalam 3 dtk</b></div><div class="ln2">Terakhir tersambung 10.49.30 · periksa Wi-Fi rumah sakit. Sampai tersambung, pantau dari nurse station.</div></div>
<div style="margin:0 12px"><span class="btn ink mb44">Coba sekarang</span></div>"""
    else:
        c = f"""{sbar(time="10.53")}{abar_team("Ns. Fajar", CONNECTED)}
<div class="idle"><div class="ring ok"><svg width="72" height="72" viewBox="0 0 34 34"><path d="M9 17.5l5 5 11-12" style="fill:none;stroke:var(--ok)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div class="it">Siaga</div><div class="is">Tidak ada panggilan lain</div></div>
<div class="mcard glass"><div class="ln">{okdot()}<b>Code Blue 305-B ditutup</b><span class="t">10.53.00</span></div>
<div class="ln2">Oleh dr. Yoga dari ponselnya · waktu respons 1 mnt 12 dtk</div></div>
{O1_TEAM}"""
    return ph(c, dark)


def s8a_call(dark):
    c = f"""{sbar(white=True, time="10.52")}<div class="cbin">
  <div class="cbh">{siren("#fff", 26)}<span>CODE BLUE</span><span class="sp"></span><span class="tt">mulai 10.51.48</span></div>
  <div class="cbw">Bangsal Melati · Lantai 3</div>
  <div class="cbbed">305-B</div>
  <div class="cbroom">Kamar 305 · Bed B</div>
  <div class="cbel"><span class="n">0:42</span><span class="l">berjalan</span></div>
  <div class="cbinfo"><span>Sumber</span><b>Tombol manual di kamar</b><span>Pasien</span><b>Tn. H.S. · 70<br>Sepsis, pneumonia</b></div>
  <span class="cbbtn">Tim sudah tiba</span>
  <div class="cbfoot">Tidak ada Code Blue lain</div>
</div>"""
    return ph(c, dark, "cbfull")


def s8b_call(dark):
    c = f"""<div class="split"><div class="ctop">{sbar(white=True, time="10.52")}<div class="in">
  <div class="cbh">{siren("#fff", 24)}<span>CODE BLUE</span><span class="sp"></span><span class="tt">Lantai 3 · Melati</span></div>
  <div class="cbbed" style="margin-top:18px">305-B</div>
  <div class="cbroom">Kamar 305 · Bed B</div>
  <div class="cbinfo" style="margin-top:18px"><span>Sumber</span><b>Tombol manual di kamar</b><span>Pasien</span><b>Tn. H.S. · 70 · Sepsis, pneumonia</b></div>
</div></div>
<div class="cbot"><div class="k">Sudah berjalan</div><div class="bigt">0:42</div><div style="font-size:15px;color:var(--tx2)">sejak panggilan 10.51.48</div>
  <div class="slide"><span class="knob">→</span>Geser · Tim sudah tiba</div>
  <div style="text-align:center;font-size:14px;color:var(--tx3)">Tidak ada Code Blue lain</div></div></div>"""
    return ph(c, dark)


def s8c_call(dark):
    def card(bid, room, el, src, pt):
        return f"""<div class="ccard"><div class="cbh">{siren("#fff", 20)}<span>CODE BLUE</span><span class="sp"></span><span class="tt">{el}</span></div>
  <div class="bb"><b>{bid}</b><span>{room}</span></div><div class="ci">{src}<br>{pt}</div><span class="cbbtn">Tim sudah tiba</span></div>"""
    c = f"""{sbar(time="10.52")}{abar_team("dr. Yoga", CONNECTED)}
<div class="mh2"><h2 style="color:var(--hiText)">2 Code Blue aktif</h2><span>paling lama di atas</span></div>
{card("301-B", "Kamar 301 · Bed B", "1:05", "Otomatis · Pra-alarm tidak diverifikasi", "Ny. R.W. · 54 · Pascalaparotomi H+1")}
{card("305-B", "Kamar 305 · Bed B", "0:42", "Tombol manual di kamar", "Tn. H.S. · 70 · Sepsis, pneumonia")}"""
    return ph(c, dark)


PHONES = [
    ("S7 · A · Antrean penuh · Terang", lambda: s7a(False)), ("S7 · A · Antrean penuh · Gelap", lambda: s7a(True)),
    ("S7 · B · Tab + dok alarm · Terang", lambda: s7b(False)), ("S7 · B · Tab + dok alarm · Gelap", lambda: s7b(True)),
    ("S7 · C · Ambil alih layar · Terang", lambda: s7c(False)), ("S7 · C · Ambil alih layar · Gelap", lambda: s7c(True)),
    ("S8 · A · Siaga · Terang", lambda: s8_idle(False, "a")), ("S8 · A · Panggilan · Terang", lambda: s8a_call(False)),
    ("S8 · A · Siaga · Gelap", lambda: s8_idle(True, "a")), ("S8 · A · Panggilan · Gelap", lambda: s8a_call(True)),
    ("S8 · B · Terputus · Terang", lambda: s8_idle(False, "b")), ("S8 · B · Panggilan · Terang", lambda: s8b_call(False)),
    ("S8 · B · Terputus · Gelap", lambda: s8_idle(True, "b")), ("S8 · B · Panggilan · Gelap", lambda: s8b_call(True)),
    ("S8 · C · Ditutup orang lain · Terang", lambda: s8_idle(False, "c")), ("S8 · C · Beberapa Code Blue · Terang", lambda: s8c_call(False)),
    ("S8 · C · Ditutup orang lain · Gelap", lambda: s8_idle(True, "c")), ("S8 · C · Beberapa Code Blue · Gelap", lambda: s8c_call(True)),
]


def ponsel():
    css = PH_CSS.replace("__DARK__", R3.TOKENS["dark"])
    body = '<div class="board">' + "".join(fn() for _, fn in PHONES) + "</div>"
    return R3.doc("Ponsel · S7 S8", R3.css(BASE5B, css), body, "light")


FRAMES = [
    ("s5-light", lambda: s5("light")), ("s5-dark", lambda: s5("dark", failed=True)),
    ("s6a-light", lambda: s6a("light")), ("s6a-dark", lambda: s6a("dark")),
    ("s6b-light", lambda: s6b("light")), ("s6b-dark", lambda: s6b("dark")),
    ("s6c-light", lambda: s6c("light")), ("s6c-dark", lambda: s6c("dark")),
    ("ponsel", ponsel),
]

if __name__ == "__main__":
    for name, fn in FRAMES:
        (HERE / f"{name}.html").write_text(fn(), encoding="utf-8")
        print("wrote", name)
