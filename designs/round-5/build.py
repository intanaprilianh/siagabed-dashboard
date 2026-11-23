"""Ronde 5 · Roll out (bagian 1): S1 Mulai shift, S3 Item antrean (semua jenis/keadaan), S4 Detail bed (3 variasi).

Dibangun dari design system (designs/system) dan helper C″ (designs/round-3/build.py).
Contoh bed di S4: 302-C Ny. D.A. (Kritis), sementara 301-B masih Pra-alarm di tempat lain.
"""
import importlib.util
import math
import pathlib

HERE = pathlib.Path(__file__).parent
_spec = importlib.util.spec_from_file_location("r3", HERE.parent / "round-3" / "build.py")
R3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R3)

oct_, tri, circ, off, siren, spinner, spark, ticks = R3.oct_, R3.tri, R3.circ, R3.off, R3.siren, R3.spinner, R3.spark, R3.ticks
PHONE, COIL, SOUND = R3.PHONE, R3.COIL, R3.SOUND

R5_CSS = """
.k{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
.card{border-radius:24px;padding:20px 22px;display:flex;flex-direction:column;gap:12px;min-width:0}
.strip{position:absolute;left:24px;right:24px;top:104px;height:60px;border-radius:20px;display:flex;align-items:center;gap:16px;padding:0 10px 0 20px;
  background:linear-gradient(var(--hiSoft),var(--hiSoft)),var(--glass2);box-shadow:inset 0 0 0 3px var(--hi),var(--shadow);font-size:17px}
.strip b{font-weight:700}.strip .cd{font-size:18px}
.strip .btn{height:44px;font-size:15px}
.strip .btn.call{box-shadow:none}
.hdr{display:flex;align-items:center;gap:22px}
.back{height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--tx2)}
.hbed{font-size:72px;font-weight:700;letter-spacing:-.04em;line-height:.9}
.hpt{font-size:20px;line-height:1.35;color:var(--tx2)}.hpt b{color:var(--tx);font-weight:600}
.kchip{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:12px;background:var(--hi);color:#fff;font-size:18px;font-weight:700}
.reason{font-size:22px;line-height:1.35}.reason b{font-weight:700}
.reason small{display:block;font-size:15px;color:var(--tx3);margin-top:4px}
.rrbig{font-size:84px;font-weight:600;letter-spacing:-.04em;line-height:.9;font-feature-settings:'tnum' 1}
.rrbig small{font-size:22px;font-weight:500;color:var(--tx2);letter-spacing:0;margin-left:6px}
.seg{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:var(--hair)}
.seg span{height:30px;padding:0 12px;border-radius:999px;display:inline-flex;align-items:center;font-size:13px;font-weight:600;color:var(--tx2)}
.seg span.on{background:var(--solid);color:var(--tx);box-shadow:0 1px 4px rgba(0,0,0,.08)}
.apbar{position:relative;height:16px;border-radius:8px;background:var(--hair);margin-top:8px}
.apbar i{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:var(--ok)}
.apbar .th{position:absolute;top:-6px;bottom:-6px;width:3px;background:var(--hi);border-radius:2px}
.apl{display:flex;justify-content:space-between;font-size:12px;color:var(--tx3);margin-top:6px}
.sq{display:grid;grid-template-columns:1fr auto;gap:10px 14px;font-size:15px;color:var(--tx2)}
.sq b{color:var(--tx);font-weight:600;text-align:right}
.tl div{display:grid;grid-template-columns:74px 1fr;gap:12px;padding:10px 0;border-top:1px solid var(--hair);font-size:14px;color:var(--tx2);line-height:1.35}
.tl div span:first-child{color:var(--tx3);font-feature-settings:'tnum' 1}
.tl b{color:var(--tx);font-weight:600}
.idg{display:grid;grid-template-columns:120px 1fr;gap:8px 12px;font-size:15px}
.idg span{color:var(--tx3)}.idg b{font-weight:600}
.tech{display:flex;align-items:center;justify-content:space-between;height:52px;padding:0 18px;border-radius:16px;font-size:15px;font-weight:600;color:var(--tx2)}
.wv{display:block}
.wl{display:flex;justify-content:space-between;font-size:12px;color:var(--tx3)}
.legendw{display:flex;gap:16px;font-size:13px;color:var(--tx3);align-items:center}
.legendw i{display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--ok);margin-right:6px;vertical-align:-1px}
"""


def wave(w, h, secs=30, rr=31, color="var(--tx)", mark="var(--ok)"):
    period = 60 / rr
    n = 600
    pts = []
    for i in range(n + 1):
        t = i / n * secs
        a = 0.78 + 0.18 * math.sin(t * 0.7)
        y = h / 2 - math.sin(2 * math.pi * t / period) * a * (h * 0.38)
        pts.append(f"{i / n * w:.1f},{y:.1f}")
    marks = []
    k = 0
    t = period / 4
    while t < secs:
        x = t / secs * w
        marks.append(f'<rect x="{x - 1.5:.1f}" y="2" width="3" height="10" rx="1.5" style="fill:{mark}"/>')
        k += 1
        t += period
    grid = "".join(f'<line x1="{i * w / 6:.1f}" x2="{i * w / 6:.1f}" y1="0" y2="{h}" style="stroke:var(--hair)" stroke-width="1"/>' for i in range(1, 6))
    return (f'<svg class="wv" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{grid}'
            f'<polyline points="{" ".join(pts)}" style="fill:none;stroke:{color}" stroke-width="2.4" stroke-linejoin="round"/>{"".join(marks)}</svg>')


STRIP = f"""<div class="strip">{oct_()}<span><b>301-B · Ny. R.W.</b> Pra-alarm · 26 dtk tanpa napas efektif</span><span class="cd">CB 9 dtk</span>
<span class="sp"></span><span class="btn call">{PHONE}Panggil Code Blue</span><span class="btn ghost">Ke antrean</span></div>"""

TL = """<div class="tl">
  <div><span>10.51.40</span><span><b>Kritis</b> · RR ≥ 30 selama 1 mnt · berbunyi 1×</span></div>
  <div><span>10.44.10</span><span><b>Waspada</b> · RR > 20 selama 2 mnt · berbunyi 1×</span></div>
  <div><span>10.20.05</span><span><b>Sudah dicek</b> Ns. Rina · "nebulisasi, posisi semi-Fowler" · diterima hub</span></div>
  <div><span>08.10.12</span><span><b>Kalibrasi</b> selesai · Ns. Rina</span></div>
</div>"""

ID = """<div class="idg"><span>Pasien</span><b>Ny. D.A. · 60 th</b><span>Diagnosis</span><b>PPOK eksaserbasi</b>
<span>No. RM</span><b>00-48-21</b><span>ICD-10</span><b>J44.1</b><span>SEP</span><b>1101R0011125V004812</b></div>"""

SIG = """<div class="sq"><span>Kualitas sinyal</span><b style="color:var(--ok)">Baik · 0,92</b><span>Kehadiran</span><b>Pasien di bed</b>
<span>Kalibrasi</span><b>08.10 hari ini</b><span>Data terakhir</span><b>1 dtk lalu</b></div>"""

AP = """<div><div style="display:flex;align-items:baseline;gap:10px"><span style="font-size:40px;font-weight:600;letter-spacing:-.02em;font-feature-settings:'tnum' 1">2 dtk</span>
<span style="font-size:15px;color:var(--tx2)">sejak napas efektif terakhir</span></div>
<div class="apbar"><i style="width:10%"></i><span class="th" style="left:calc(100% - 3px)"></span></div>
<div class="apl"><span>0</span><span style="color:var(--hiText);font-weight:600">20 dtk → Pra-alarm</span></div></div>"""

TECH = '<div class="tech glass2"><span>Data teknis · hub 302-C · kalibrasi · SQI</span><span>Buka ▸</span></div>'


def topbar():
    return R3.topbar()


def hdr(close=False):
    left = '<span class="back glass2">← Bangsal</span>' if not close else ""
    right = ('<span class="btn ink" style="height:52px;font-size:17px">Sudah dicek</span>'
             '<span class="btn ghost" style="height:52px;font-size:17px">Tulis tindak lanjut</span>')
    if close:
        right += '<span class="x" style="width:44px;height:44px">×</span>'
    return f"""<div class="hdr">{left}<span class="hbed">302-C</span><span class="kchip">{tri("#fff", 18)}Kritis</span>
<span class="hpt"><b>Ny. D.A.</b> · 60<br>PPOK eksaserbasi</span><span class="sp"></span>{right}</div>"""


def reason_card(cls="card glass"):
    return f"""<div class="{cls}" style="box-shadow:inset 0 0 0 2px var(--hiEdge),var(--shadow)"><div class="k">Kenapa Kritis</div>
<div class="reason"><b style="color:var(--hiText)">RR 31 /mnt ↑</b> · ≥ 30 selama 1 mnt 20 dtk<small>Mulai 10.51.40 · berbunyi 1× · belum dicek sejak Kritis</small></div></div>"""


def trend_card(w, h, cls="card glass"):
    return f"""<div class="{cls}"><div style="display:flex;align-items:flex-end;gap:24px"><div><div class="k">Laju napas</div><div class="rrbig">31<small>/mnt ↑</small></div></div>
<span class="sp"></span><span class="seg"><span class="on">30 mnt</span><span>2 jam</span><span>Shift</span></span></div>{spark(w, h)}</div>"""


def wave_card(w, h, cls="card glass"):
    return f"""<div class="{cls}"><div style="display:flex;align-items:center;gap:16px"><div class="k">Gelombang napas · live</div><span class="sp"></span>
<span class="legendw"><span><i></i>napas efektif</span><span>25 sampel/dtk</span></span></div>{wave(w, h)}<div class="wl"><span>−30 dtk</span><span>sekarang</span></div></div>"""


# ------------------------------------------------------------------ S4 · A Halaman penuh
A_CSS = """
.main{position:absolute;left:24px;right:24px;top:180px;bottom:24px;display:flex;flex-direction:column;gap:18px}
.grid{flex:1;display:grid;grid-template-columns:1fr 440px;gap:18px;min-height:0}
.col{display:flex;flex-direction:column;gap:16px;min-height:0}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
"""


def s4a(mode):
    body = f"""{topbar()}{STRIP}
<div class="main">{hdr()}
  <div class="grid">
    <div class="col">
      <div class="row2">{reason_card()}<div class="card glass"><div class="k">Henti napas</div>{AP}</div></div>
      {trend_card(1300, 150)}
      {wave_card(1300, 120)}
    </div>
    <div class="col">
      <div class="card glass"><div class="k">Sinyal dan pad</div>{SIG}</div>
      <div class="card glass" style="flex:1"><div class="k">Riwayat hari ini</div>{TL}</div>
      <div class="card glass"><div class="k">Identitas</div>{ID}</div>
      {TECH}
    </div>
  </div>
</div>"""
    return R3.doc(f"S4 · A · Halaman penuh · {mode}", R3.css(R5_CSS, A_CSS), body, mode)


# ------------------------------------------------------------------ S4 · B Panel di atas Bangsal
B_CSS = """
.wrap{grid-template-columns:1fr 860px!important}
.sheet{border-radius:32px;padding:24px;display:flex;flex-direction:column;gap:14px;min-width:0}
.sheet .hbed{font-size:56px}
.sheet .hpt{font-size:17px}
.sheet .hdr{gap:16px}
.sheet .hdr .btn{height:46px!important;font-size:15px!important}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.sheet .card{padding:16px 18px;gap:10px;border-radius:20px}
.sheet .rrbig{font-size:56px}
.idl{font-size:16px;color:var(--tx2);margin-top:-6px}.idl b{color:var(--tx)}
.acts2{display:flex;gap:10px;margin-top:auto}.acts2 .btn{height:52px;font-size:16px}
.sheet .reason{font-size:19px}
.sheet .tl div{padding:8px 0;font-size:13px}
.ri.kr.selr{box-shadow:0 0 0 4px var(--bg),0 0 0 7px var(--sel),0 14px 30px rgba(215,38,43,.30)!important}
.left .ri{grid-template-columns:170px 130px 1fr 1fr auto!important}
"""


def s4b(mode):
    q = f"""<section class="left">
    <div class="hd"><h1>Perlu tindakan sekarang</h1><span>4 item</span></div>
    {R3.pra_card()}{R3.row_kr().replace('class="ri kr"', 'class="ri kr selr"', 1)}{R3.row_ws("3")}{R3.row_tk("4")}
  </section>"""
    tl2 = TL.replace('<div><span>08.10.12', '<div style="display:none"><span>08.10.12').replace('<div><span>10.20.05', '<div style="display:none"><span>10.20.05')
    sheet = f"""<section class="sheet glass">
    <div class="hdr"><span class="hbed">302-C</span><span class="kchip">{tri("#fff", 18)}Kritis</span><span class="sp"></span><span class="x" style="width:44px;height:44px">×</span></div>
    <div class="idl"><b>Ny. D.A.</b> · 60 · PPOK eksaserbasi · No. RM 00-48-21 · ICD-10 J44.1 · SEP 1101R0011125V004812</div>
    <div class="duo">{reason_card()}<div class="card glass2"><div class="k">Henti napas</div>{AP}</div></div>
    {trend_card(780, 80, "card glass2")}
    {wave_card(780, 64, "card glass2")}
    <div class="duo"><div class="card glass2"><div class="k">Sinyal dan pad</div>{SIG}</div><div class="card glass2"><div class="k">Riwayat hari ini</div>{tl2}</div></div>
    <div class="acts2"><span class="btn ink">Sudah dicek</span><span class="btn ghost">Tulis tindak lanjut</span><span class="sp"></span><span class="btn ghost">Buka halaman penuh ↗</span></div>
  </section>"""
    body = f'{topbar()}<div class="wrap">{q}{sheet}</div>'
    return R3.doc(f"S4 · B · Panel · {mode}", R3.css(R5_CSS, B_CSS), body, mode)


# ------------------------------------------------------------------ S4 · C Gaya monitor
C_CSS = """
.main{position:absolute;left:24px;right:24px;top:180px;bottom:24px;display:flex;flex-direction:column;gap:18px}
.mon{border-radius:28px;padding:22px 26px;display:grid;grid-template-columns:1fr 330px;gap:28px;align-items:stretch}
.mon .side{display:flex;flex-direction:column;justify-content:space-between;padding-left:28px;border-left:1px solid var(--hair)}
.mon .rrbig{font-size:132px}
.mon .rrbig small{font-size:26px}
.four{display:grid;grid-template-columns:1.1fr 1fr 1.1fr 1fr;gap:16px;flex:1;min-height:0}
"""


def s4c(mode):
    body = f"""{topbar()}{STRIP}
<div class="main">{hdr()}
  <div class="mon glass">
    <div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;align-items:center;gap:16px"><div class="k">Gelombang napas · live</div><span class="sp"></span>
      <span class="legendw"><span><i></i>napas efektif</span><span>25 sampel/dtk</span></span></div>{wave(1420, 200)}<div class="wl"><span>−30 dtk</span><span>sekarang</span></div>
      <div style="margin-top:6px">{spark(1420, 70)}</div></div>
    <div class="side"><div><div class="k">Laju napas</div><div class="rrbig" style="color:var(--hiText)">31<small>/mnt ↑</small></div>
      <div style="font-size:15px;color:var(--hiText);font-weight:700;margin-top:8px">≥ 30 selama 1 mnt 20 dtk</div></div>
      <div><div class="k" style="margin-bottom:6px">Henti napas</div>{AP}</div></div>
  </div>
  <div class="four">
    {reason_card()}
    <div class="card glass"><div class="k">Sinyal dan pad</div>{SIG}</div>
    <div class="card glass"><div class="k">Riwayat hari ini</div>{TL.replace('<div><span>08.10.12', '<div style="display:none"><span>08.10.12')}</div>
    <div class="card glass"><div class="k">Identitas</div>{ID}{TECH}</div>
  </div>
</div>"""
    return R3.doc(f"S4 · C · Monitor · {mode}", R3.css(R5_CSS, C_CSS), body, mode)


# ------------------------------------------------------------------ S1 Mulai shift
S1_CSS = """
.s1{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1180px;display:grid;grid-template-columns:1fr 380px;gap:20px}
.s1 .card{padding:34px 36px;gap:22px;border-radius:32px}
.s1 h1{font-size:44px;font-weight:600;letter-spacing:-.03em}
.fl{display:flex;flex-direction:column;gap:10px}
.sel{height:56px;border-radius:16px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:18px;font-weight:600;box-shadow:none!important}
.seg2{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.seg2 span{height:64px;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:17px;font-weight:600;border:1px solid var(--hair)}
.seg2 span small{font-size:13px;font-weight:500;color:var(--tx3)}
.seg2 span.on{background:var(--ink);color:var(--onInk);border-color:transparent}.seg2 span.on small{color:var(--onInk);opacity:.75}
.names{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.names span{height:56px;border-radius:16px;display:flex;align-items:center;gap:10px;padding:0 16px;font-size:17px;font-weight:600;border:1px solid var(--hair)}
.names span.on{box-shadow:inset 0 0 0 2.5px var(--ink)}
.names .av{width:30px;height:30px}
.snd{display:flex;gap:8px;flex-wrap:wrap}
.snd .btn{height:46px;font-size:15px}
.go{height:72px!important;font-size:21px!important;width:100%}
.note{font-size:14px;color:var(--tx3);line-height:1.4}
.side .card{gap:14px}
.side .line{display:flex;align-items:center;gap:10px;font-size:16px;line-height:1.35}
"""


def s1(mode):
    body = f"""<div class="s1">
  <div class="card glass">
    <div style="display:flex;align-items:center;gap:14px"><span class="mk glass2" style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center">{COIL}</span>
      <div><div class="k">SiagaBed · Senin, 23 Nov 2026 · 06.58</div><h1>Mulai jaga</h1></div></div>
    <div class="fl"><div class="k">Bangsal</div><div class="sel glass2">Bangsal Melati · Lantai 3<span style="color:var(--tx3)">▾</span></div></div>
    <div class="fl"><div class="k">Shift</div><div class="seg2"><span class="on">Pagi<small>07.00–14.00</small></span><span>Siang<small>14.00–21.00</small></span><span>Malam<small>21.00–07.00</small></span></div></div>
    <div class="fl"><div class="k">Perawat jaga</div><div class="names">
      <span class="on glass2"><span class="av">R</span>Ns. Rina</span><span class="glass2"><span class="av" style="background:var(--tx3)">D</span>Ns. Dewi</span><span class="glass2"><span class="av" style="background:var(--tx3)">A</span>Ns. Andi</span>
      <span class="glass2"><span class="av" style="background:var(--tx3)">S</span>Ns. Sari</span><span class="glass2"><span class="av" style="background:var(--tx3)">B</span>Ns. Budi</span><span class="glass2" style="color:var(--tx2)">+ Nama lain</span></div></div>
    <div class="fl"><div class="k">Cek suara</div><div class="snd"><span class="btn ghost">▶ Waspada</span><span class="btn ghost">▶ Kritis</span><span class="btn ghost">▶ Pra-alarm</span><span class="btn ghost">▶ Code Blue</span></div>
      <div class="note">Tombol Mulai jaga sekaligus menyalakan suara di layar ini. Pastikan speaker nurse station tidak dibisukan.</div></div>
    <span class="btn ink go">Mulai jaga sebagai Ns. Rina</span>
  </div>
  <div class="side" style="display:flex;flex-direction:column;gap:20px">
    <div class="card glass"><div class="k">Keadaan bangsal sekarang</div>
      <div class="line"><span class="dot"></span><b>8 hub</b>&nbsp;terhubung · Live</div>
      <div class="line"><b style="font-size:28px">7/8</b>&nbsp;bed terpantau</div>
      <div class="line">{off(s=18)}<span><b>302-B</b> tidak terpantau · pad terlepas sejak 06.41</span></div></div>
    <div class="card glass"><div class="k">Dari shift malam</div>
      <div class="line"><span><b>2</b> tindak lanjut belum ditulis</span></div>
      <div class="line" style="color:var(--tx2);font-size:14px">301-C Waspada 04.12 · 302-C Waspada 05.40</div>
      <span class="btn ghost" style="height:44px;font-size:15px;align-self:flex-start">Lihat ringkasan serah terima</span></div>
  </div>
</div>"""
    return R3.doc(f"S1 · Mulai shift · {mode}", R3.css(R5_CSS, S1_CSS), body, mode)


# ------------------------------------------------------------------ S3 Item antrean · semua jenis dan keadaan
S3_CSS = """
body{width:1920px!important;height:auto!important;overflow:visible!important;padding:56px 64px 64px}
h1.t{font-size:44px;font-weight:600;letter-spacing:-.03em}
.lead{font-size:18px;color:var(--tx2);margin:8px 0 30px;max-width:1300px;line-height:1.45}
.sec{margin-top:34px}
.sec h2{font-size:24px;font-weight:600;margin-bottom:14px}
.rw{display:grid;grid-template-columns:300px 1240px;gap:28px;align-items:center;margin-bottom:14px}
.rw .lab{font-size:15px;color:var(--tx2);line-height:1.4}.rw .lab b{display:block;color:var(--tx);font-size:16px}
.ri{grid-template-columns:190px 140px 280px 1fr auto}
.ri.fu{box-shadow:inset 0 0 0 2px var(--ink),var(--shadow)}.ri.fu .lv{color:var(--tx)}
.ri.ok2 .lv{color:var(--ok)}
.ri.calm{opacity:1}
.okmark{font-size:14px;color:var(--ok);font-weight:600}
"""


def ri(cls, n, badge_style, icon, level, bid, pt, why, acts, glass=True):
    g = " glass2" if glass else ""
    ob = f'<span class="ordb" style="{badge_style}">{n}</span>' if n else ""
    return (f'<div class="ri {cls}{g}"><span class="lv">{ob}{icon}{level}</span><span class="bid">{bid}</span>'
            f'<span class="pt">{pt}</span><span class="why">{why}</span><span class="acts">{acts}</span></div>')


def s3():
    cbk = R3.bed24("light")
    cbk = cbk[cbk.index('<div class="qi cbk">'):]
    cbk = cbk[:cbk.index('<div class="ri prar">')]
    cb_arrived = cbk.replace('<span class="btn onred">Tim sudah tiba</span>',
                             f'<span class="btn sending" style="background:rgba(255,255,255,.18);color:#fff">{spinner("#fff")}Mengirim ke hub…</span>')
    cb_arrived = cb_arrived.replace('<span class="btn onred2">Buka detail</span>', '<span class="sendnote" style="font-size:15px">Tim tiba 10.53.00 · waktu respons 1 mnt 12 dtk</span>')
    PT_RW = "<b>Ny. R.W.</b> · 54<br>Pascalaparotomi H+1"
    rows = [
        ("Code Blue", [
            ("Berjalan", "Selalu item #1. Sumber, lama berjalan, ponsel tim berbunyi.", cbk),
            ("Tim sudah tiba · mengirim", "Waktu respons dicatat. Setelah diterima hub, item berubah jadi Perlu tindak lanjut.", cb_arrived),
        ]),
        ("Pra-alarm", [
            ("Berjalan", "Hitung mundur ke Code Blue otomatis. Batalkan harus ditahan 2 dtk.", R3.pra_card()),
            ("Napas kembali", "Pra-alarm berhenti sendiri; item tinggal 10 dtk lalu hilang, kejadian tercatat di log.",
             ri("ok2", "", "", R3.okdot() + "&nbsp;", "Napas kembali", "301-B", PT_RW,
                "Napas efektif kembali 10.53.15<small>Pra-alarm berhenti sendiri · tercatat di log</small>", '<span class="btn ghost">Lihat detail</span>')),
            ("Dibatalkan dari bedhead", "Pembatalan bisa dari tombol di bedhead; dasbor menjelaskan siapa dan dari mana.",
             ri("ok2", "", "", R3.okdot() + "&nbsp;", "Dibatalkan", "301-B", PT_RW,
                "Dibatalkan di bedhead 10.53.12<small>Pasien sudah dicek · diterima hub</small>", '<span class="btn ghost">Tulis tindak lanjut</span>')),
            ("Pembatalan gagal", "Perintah tidak sampai ke hub: arahkan ke bedhead, hitung mundur tetap berjalan.",
             R3.pra_card("4 dtk", 4, failed=True)),
        ]),
        ("Kritis", [
            ("Belum dicek", "Merah penuh. Bunyi 1× tegas.", R3.row_kr()),
            ("Mengirim", "Status kiriman terlihat sampai hub menerima.", R3.row_kr(sending=True)),
            ("Sudah dicek", "Tetap merah penuh selama RR masih ≥ 30, tetapi diam dan turun di bawah Kritis yang belum dicek.",
             R3.row_kr().replace('<span class="acts"><span class="btn onred">Sudah dicek</span><span class="btn onred2">Lihat tren</span></span>',
                                 '<span class="acts"><span class="sendnote" style="font-size:14px">✓ Dicek Ns. Rina 10.54 · diterima hub</span><span class="btn onred2">Lihat tren</span></span>')),
        ]),
        ("Waspada", [
            ("Belum dicek", "Di atas Waspada yang sudah dicek.", R3.row_ws("4", "304-B", "<b>Tn. K.R.</b> · 77 · Pasca-ORIF femur", "RR 9 /mnt ↓<small>≤ 10 selama 2 mnt 30 dtk</small>",
                                                                          '<span class="btn ink">Sudah dicek</span><span class="btn ghost">Lihat tren</span>')),
            ("Sudah dicek", "Lebih tenang: tanpa tombol utama, centang dan nama pengecek.", R3.row_ws("5")),
        ]),
        ("Tidak terpantau", [
            ("Pad terlepas", "Penyebab dan langkah berikutnya dalam bahasa perawat.", R3.row_tk("6")),
            ("Hub offline", "", R3.row_tk("6", "303-A", "<b>Tn. J.W.</b> · 66 · CKD stadium 4", "Hub offline sejak 10.49<small>Periksa daya hub di bedhead; lampu hub harus hijau</small>")),
            ("Data basi > 5 dtk", "", R3.row_tk("6", "302-A", "<b>Ny. L.K.</b> · 45 · DM tipe 2, selulitis", "Data basi · terakhir 10.53.02<small>Hub tidak mengirim data 8 dtk · periksa daya dan Wi-Fi hub</small>")),
            ("Belum dikalibrasi", "", R3.row_tk("6", "304-C", "<b>Tn. E.P.</b> · 58 · Pneumonia", "Belum dikalibrasi<small>Pasien baru masuk 10.40 · kalibrasi dari menu bed (± 1 mnt)</small>")),
        ]),
        ("Perlu tindak lanjut", [
            ("Setelah Code Blue / kejadian", "Paling bawah di antrean, tanpa bunyi. Hilang setelah tindak lanjut disimpan.",
             ri("fu", "7", "background:var(--ink);color:var(--onInk)", "", "Tindak lanjut", "305-B", "<b>Tn. H.S.</b> · 70 · Sepsis, pneumonia",
                "Code Blue selesai 10.56<small>Respons 1 mnt 12 dtk · tim: dr. jaga + 2 perawat</small>", '<span class="btn ink">Tulis tindak lanjut</span>')),
        ]),
    ]
    html = []
    for title, items in rows:
        html.append(f'<div class="sec"><h2>{title}</h2>')
        for lab, desc, item in items:
            html.append(f'<div class="rw"><div class="lab"><b>{lab}</b>{desc}</div><div>{item}</div></div>')
        html.append("</div>")
    body = f"""<h1 class="t">S3 · Item antrean</h1>
<div class="lead">Semua jenis item dan keadaannya, urut sesuai antrean: Code Blue → Pra-alarm → Kritis → Waspada → Tidak terpantau → Perlu tindak lanjut. Setiap item: bed, pasien, alasan, waktu, satu aksi utama, dan status kiriman.</div>
{"".join(html)}"""
    return R3.doc("S3 · Item antrean", R3.css(R5_CSS, S3_CSS), body, "light")


FRAMES = [
    ("s1-light", lambda: s1("light")), ("s1-dark", lambda: s1("dark")),
    ("s3-light", s3),
    ("s4a-light", lambda: s4a("light")), ("s4a-dark", lambda: s4a("dark")),
    ("s4b-light", lambda: s4b("light")), ("s4b-dark", lambda: s4b("dark")),
    ("s4c-light", lambda: s4c("light")), ("s4c-dark", lambda: s4c("dark")),
]

if __name__ == "__main__":
    for name, fn in FRAMES:
        (HERE / f"{name}.html").write_text(fn(), encoding="utf-8")
        print("wrote", name)
